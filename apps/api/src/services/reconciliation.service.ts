import { reconciliationService, ReconciliationService } from './reconciliation.service';
import { ReconciliationEngine } from './reconciliation-engine.service';
import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { syncLogs } from '../../../../packages/db/src/drizzle/schema';
import crypto from 'crypto';

export class ReconciliationOrchestrator {
    /**
     * Requirement 11 (Reconciliation job architecture)
     */
    public async triggerReconciliation(siteId: string, domain: 'ORDERS' | 'INTEGRATIONS', connectorId?: string, range?: { start: string, end: string }) {
        const jobId = crypto.randomUUID();
        const start = range?.start ? new Date(range.start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const end = range?.end ? new Date(range.end) : new Date();

        // Register job
        await db.insert(syncLogs).values({
            syncId: jobId,
            siteId,
            connectorId: connectorId || 'RECON_GENERIC',
            status: 'PENDING',
        });

        // Async Execution
        this.executeAsync(jobId, siteId, domain, connectorId, start, end);

        return { jobId, status: 'QUEUED' };
    }

    private async executeAsync(jobId: string, siteId: string, domain: any, connectorId: any, start: Date, end: Date) {
        try {
            const summary = await ReconciliationEngine.runReconciliation({
                siteId,
                domain,
                connectorId,
                start,
                end
            });

            // Requirement 10 (Explainable results)
            await db.update(syncLogs).set({
                status: 'SUCCESS',
                errorSummary: { 
                    message: `Reconciliation ${summary.status}`,
                    confidenceScore: summary.confidenceScore,
                    mismatchesFound: summary.counts.mismatched 
                }
            }).where(eq(syncLogs.syncId, jobId));
            
            console.log(`[ReconOrchestrator] Job ${jobId} finished with quality score ${summary.confidenceScore}`);
        } catch (err: any) {
            console.error(`[ReconOrchestrator] Job ${jobId} failed:`, err);
        }
    }
}

export const reconciliationOrchestrator = new ReconciliationOrchestrator();
