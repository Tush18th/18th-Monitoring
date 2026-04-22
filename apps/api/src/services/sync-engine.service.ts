import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { 
    connectorSyncRuns, 
    pipelineCheckpoints,
    connectorInstances 
} from '../../../../packages/db/src/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { HardenedIngestionService } from './hardened-ingestion.service';
import { ConnectorManagerService } from './connector-manager.service';

export interface SyncJobOptions {
    siteId: string;
    connectorId: string;
    syncType: 'POLL' | 'BACKFILL' | 'MANUAL';
    force?: boolean;
}

export class SyncEngine {
    private static activeLocks: Set<string> = new Set();

    /**
     * Executes a robust sync job with locking and checkpointing.
     * Requirement 8 (Job-based orchestration)
     */
    static async executeJob(options: SyncJobOptions) {
        const lockKey = `${options.siteId}:${options.connectorId}`;

        // 1. CONCURRENCY CONTROL (Requirement 12)
        if (this.activeLocks.has(lockKey) && !options.force) {
            console.warn(`[SyncEngine] Job already running for ${lockKey}. Skipping.`);
            return { skipped: true, reason: 'LOCKED' };
        }

        this.activeLocks.add(lockKey);
        const startTime = new Date();
        const runId = Math.random().toString(36).substring(7);

        try {
            console.log(`[SyncEngine] Starting ${options.syncType} job for ${lockKey} (RunID: ${runId})`);

            // 2. REGISTER RUN (Requirement 11)
            await db.insert(connectorSyncRuns).values({
                id: runId,
                connectorInstanceId: options.connectorId,
                syncType: options.syncType,
                status: 'RUNNING',
                startedAt: startTime,
            });

            // 3. FETCH CHECKPOINT (Requirement 9)
            const checkpoint = await this.getCheckpoint(options.connectorId, options.siteId);
            
            // 4. EXECUTE BATCHES
            // In production: Loop until no more records or rate limit reached
            const result = await this.runBatch(options, checkpoint);

            // 5. FINALIZE (Requirement 11)
            await db.update(connectorSyncRuns).set({
                status: result.failed === 0 ? 'SUCCESS' : 'PARTIAL',
                finishedAt: new Date(),
                recordsFetched: result.fetched,
                recordsProcessed: result.processed,
                recordsFailed: result.failed,
                checkpointValue: result.nextCheckpoint
            }).where(and(
                eq(connectorSyncRuns.connectorInstanceId, options.connectorId),
                eq(connectorSyncRuns.status, 'RUNNING') // Simplified for demo
            ));

            // Update Instance State
            await ConnectorManagerService.completeSyncRun(options.connectorId, options.siteId, {
                fetched: result.fetched,
                processed: result.processed,
                rejected: result.failed,
                checkpoint: result.nextCheckpoint ?? undefined
            });

            return { runId, status: 'COMPLETED', ...result };
        } catch (err: any) {
            console.error(`[SyncEngine] Fatal job error for ${runId}:`, err);
            
            await db.update(connectorSyncRuns).set({
                status: 'FAILED',
                finishedAt: new Date(),
                errorSummary: { message: err.message, stack: err.stack }
            }).where(and(
                eq(connectorSyncRuns.connectorInstanceId, options.connectorId),
                eq(connectorSyncRuns.status, 'RUNNING')
            ));

            await ConnectorManagerService.recordHealthSignal(options.connectorId, 'sync', false, err);
            throw err;
        } finally {
            this.activeLocks.delete(lockKey);
        }
    }

    private static async runBatch(options: SyncJobOptions, cursor: string | null) {
        // MOCK DATA FETCH (Requirement 9 & 10 foundation)
        // In real use, this calls ExternalSyncService which interfaces with Third Party APIs
        const mockBatch = [
            { id: 'REC_001', data: { val: 10 }, ts: Date.now() - 1000 },
            { id: 'REC_002', data: { val: 20 }, ts: Date.now() }
        ];

        let fetched = 0;
        let processed = 0;
        let failed = 0;

        for (const record of mockBatch) {
            try {
                fetched++;
                // INGEST (Requirement 1 - Async Durable Flow)
                await HardenedIngestionService.ingest({
                    siteId: options.siteId,
                    connectorId: options.connectorId,
                    sourceSystem: 'SyncEngine',
                    eventType: 'POLL_SYNC',
                    payload: record,
                    sourceEventId: record.id
                });
                processed++;
            } catch (err) {
                console.error(`[SyncEngine] Record failure:`, record.id);
                failed++;
                // QUARANTINE / PARTIAL FAILURE (Requirement 13)
            }
        }

        // UPDATE CHECKPOINT (Requirement 9)
        const nextCheckpoint = mockBatch.length > 0 ? mockBatch[mockBatch.length - 1].ts.toString() : cursor;
        if (nextCheckpoint) {
            await this.updateCheckpoint(options.connectorId, options.siteId, nextCheckpoint);
        }

        return { fetched, processed, failed, nextCheckpoint };
    }

    private static async getCheckpoint(connectorId: string, siteId: string): Promise<string | null> {
        const cp = await db.select()
            .from(pipelineCheckpoints)
            .where(and(
                eq(pipelineCheckpoints.integrationId as any, connectorId) as any,
                eq(pipelineCheckpoints.siteId as any, siteId) as any
            ) as any)
            .limit(1);
        return cp.length > 0 ? cp[0].cursorValue : null;
    }

    private static async updateCheckpoint(connectorId: string, siteId: string, value: string) {
        try {
            await db.insert(pipelineCheckpoints).values({
                id: Math.random().toString(36).substring(2, 10),
                integrationId: connectorId,
                siteId: siteId,
                entityType: 'ALL',
                cursorType: 'TIMESTAMP',
                cursorValue: value,
                metadata: { lastUpdate: new Date().toISOString() }
            }).onConflictDoUpdate({
                target: [pipelineCheckpoints.integrationId as any, pipelineCheckpoints.entityType as any],
                set: { cursorValue: value, updatedAt: new Date() }
            }) as any;
        } catch (err) {
            await db.update(pipelineCheckpoints)
                .set({ cursorValue: value, updatedAt: new Date() })
                .where(and(
                    eq(pipelineCheckpoints.integrationId as any, connectorId) as any,
                    eq(pipelineCheckpoints.siteId as any, siteId) as any
                ) as any);
        }
    }
}
