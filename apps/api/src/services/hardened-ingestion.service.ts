import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { ingestionEvents, qualityGateResults, systemHealthMetrics } from '../../../../packages/db/src/drizzle/schema';
import { 
    IngestionMetadata, 
    ProcessingMetadata, 
    IngestionStatus, 
    ValidationStatus,
    BackendErrorCategory
} from '../../../../packages/shared-types/src';
import { ValidationEngine } from '../../../../packages/ops/src/validation';
import { KafkaPublisherAdapter } from '../../../../packages/streaming/src';
import { TOPICS } from '../config/topics';
import { OutboundEventService } from './outbound-event.service';

const publisher = new KafkaPublisherAdapter();

export interface IngestRequest {
    siteId: string;
    connectorId: string;
    sourceSystem: string;
    eventType: string;
    payload: any;
    sourceEventId?: string;
    metadata?: Record<string, any>;
}

export class HardenedIngestionService {
    /**
     * STEP 1: DURABLE INGESTION (Requirement 1)
     * Accept -> Dedupe -> Store Raw -> Publish for Async -> Fast Ack.
     */
    static async ingest(req: IngestRequest): Promise<{ eventId: string; status: IngestionStatus }> {
        const eventId = crypto.randomUUID();
        const correlationId = req.metadata?.correlationId || crypto.randomUUID();
        const traceId = req.metadata?.traceId || crypto.randomUUID();

        // 1. IDEMPOTENCY CHECK (Requirement 2)
        if (req.sourceEventId) {
            const existing = await db.select()
                .from(ingestionEvents)
                .where(and(
                    eq(ingestionEvents.connectorId, req.connectorId),
                    eq(ingestionEvents.sourceEventId, req.sourceEventId)
                ))
                .limit(1);
            
            if (existing.length > 0) {
                console.log(`[HardenedIngestion] DUPLICATE DETECTED: ${req.sourceEventId} for connector ${req.connectorId}`);
                await this.recordMetric('ingestion_duplicate_count', 1, { siteId: req.siteId, connectorId: req.connectorId });
                return { eventId: existing[0].eventId, status: existing[0].processingStatus as IngestionStatus };
            }
        }

        const ingestionRecord = {
            eventId,
            siteId: req.siteId,
            connectorId: req.connectorId,
            sourceSystem: req.sourceSystem,
            sourceEventId: req.sourceEventId,
            eventType: req.eventType,
            correlationId,
            traceId,
            rawPayload: req.payload,
            processingStatus: 'PENDING' as IngestionStatus,
            validationStatus: 'PENDING' as ValidationStatus,
            provenance: req.metadata?.provenance || {},
            schemaVersion: '1.0.0',
        };

        try {
            // 2. STORE RAW LAYER (Requirement 1 - Durable)
            await db.insert(ingestionEvents).values(ingestionRecord);

            // 3. ASYNC HANDOFF (Requirement 1 - Async Step)
            // In production, this goes to Kafka/Topic. For this phase, we trigger processing asynchronously.
            this.processAsync(eventId).catch(err => console.error(`[HardenedIngestion] Async processing trigger failed for ${eventId}:`, err));

            await this.recordMetric('ingestion_ack_count', 1, { siteId: req.siteId, connectorId: req.connectorId });

            return { eventId, status: 'PENDING' };
        } catch (err: any) {
            console.error(`[HardenedIngestion] Ingestion failure:`, err);
            await this.recordMetric('ingestion_failure_count', 1, { siteId: req.siteId, error: 'storage_error' });
            throw err;
        }
    }

    /**
     * STEP 2: ASYNC PROCESSING (Requirement 4)
     * Handles Validation, Normalization, and DLQ logic.
     */
    private static async processAsync(eventId: string) {
        const records = await db.select().from(ingestionEvents).where(eq(ingestionEvents.eventId, eventId)).limit(1);
        if (records.length === 0) return;
        const record = records[0];

        try {
            await db.update(ingestionEvents).set({ processingStatus: 'PROCESSING' }).where(eq(ingestionEvents.eventId, eventId));

            // 1. QUALITY GATE (Hardened Integrity - Part 1)
            const { status: vStatus, qualityState, confidenceScore, results } = ValidationEngine.run(eventId, record.rawPayload);
            
            if (results.length > 0) {
                // Bulk insert validation results for auditability (Requirement 19)
                // (Simplified for this phase to avoid complex nested insert map loop if adapter is mock)
            }

            // 2. DATA QUALITY STATES (Requirement 3)
            // Update core record with integrity metadata
            await db.update(ingestionEvents).set({ 
                validationStatus: vStatus,
                processingStatus: (vStatus === 'REJECTED') ? 'FAILED' : 'COMPLETED',
                // (In a real DB, we'd add quality_state and confidence_score columns)
                // Storing in provenance/metadata for now to preserve schema compatibility
                provenance: { 
                    ...(record.provenance as any), 
                    quality: qualityState, 
                    confidence: confidenceScore 
                },
                updatedAt: new Date()
            }).where(eq(ingestionEvents.eventId, eventId));

            // 3. ASYNC DOWNSTREAM (Only trusted data)
            if (vStatus !== 'REJECTED') {
                await publisher.publishBatch(TOPICS.SERVER_EVENTS, [record]);
            }


            await this.recordMetric('ingestion_process_success', 1, { siteId: record.siteId, connectorId: record.connectorId });
        } catch (err: any) {
            console.error(`[HardenedIngestion] Processing error for ${eventId}:`, err);
            
            // RETRY LOGIC (Requirement 15)
            const newRetryCount = ((record.retryCount as number) || 0) + 1;
            const isDLQ = newRetryCount >= 3;

            await db.update(ingestionEvents).set({
                processingStatus: isDLQ ? 'FAILED' : 'RETRYING',
                retryCount: newRetryCount,
                lastError: { message: err.message, timestamp: new Date().toISOString() },
                errorCategory: 'PROCESSING_ERROR' as BackendErrorCategory
            }).where(eq(ingestionEvents.eventId, eventId));

            if (isDLQ) {
                await this.recordMetric('ingestion_dlq_count', 1, { siteId: record.siteId, connectorId: record.connectorId });
                
                // Outbound notification for external monitoring systems
                await OutboundEventService.emit({
                    siteId: record.siteId,
                    type: 'connector.failed',
                    payload: {
                        connectorId: record.connectorId,
                        eventId: record.eventId,
                        reason: err.message,
                        status: 'DLQ_LIMIT_REACHED'
                    },
                    correlationId: record.correlationId as string
                });
            }
        }
    }

    private static async recordMetric(name: string, value: number, labels: Record<string, any>) {
        try {
            await db.insert(systemHealthMetrics).values({
                metricName: name,
                metricValue: value,
                labels
            });
        } catch (mErr) {
            console.warn('[HardenedIngestion] Failed to record metrics:', mErr);
        }
    }
}
