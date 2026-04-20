import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { ingestionEvents } from '../../../../packages/db/src/drizzle/schema';
import { eq, and, between, gte, lte } from 'drizzle-orm';
import { HardenedIngestionService } from './hardened-ingestion.service';

export class ReplayService {
    /**
     * Replays a single failed event.
     * Requirement 6 (Safe replay with idempotency)
     */
    static async replayEvent(eventId: string) {
        const events = await db.select().from(ingestionEvents).where(eq(ingestionEvents.eventId, eventId)).limit(1);
        if (events.length === 0) throw new Error('Event not found');
        
        const event = events[0];
        console.log(`[ReplayService] Replaying event ${eventId} for connector ${event.connectorId}`);

        // Re-trigger the ASYNC processing step (Step 2 of the ingestion flow)
        // This is safe because Step 2 handles idempotency and ordering
        // In our current mock implementation, we access processAsync via public exposure or internal call
        // For this hardening, we'll manually re-invoke the ingestion logic or a dedicated replay path
        
        return HardenedIngestionService.ingest({
            siteId: event.siteId,
            connectorId: event.connectorId,
            sourceSystem: event.sourceSystem,
            eventType: event.eventType,
            payload: event.rawPayload,
            sourceEventId: event.sourceEventId || undefined,
            metadata: {
                correlationId: event.correlationId,
                traceId: event.traceId,
                provenance: { ...(event.provenance as any), replayedAt: new Date().toISOString() }
            }
        });
    }

    /**
     * Replays a batch of events based on filter criteria.
     * Requirement 6 (Batch replay)
     */
    static async replayBatch(filters: { connectorId?: string; siteId: string; start?: Date; end?: Date; status?: string }) {
        const query = db.select().from(ingestionEvents).where(and(
            eq(ingestionEvents.siteId, filters.siteId),
            filters.connectorId ? eq(ingestionEvents.connectorId, filters.connectorId) : undefined,
            filters.status ? eq(ingestionEvents.processingStatus, filters.status) : eq(ingestionEvents.processingStatus, 'FAILED'),
            filters.start ? gte(ingestionEvents.ingestionTimestamp, filters.start) : undefined,
            filters.end ? lte(ingestionEvents.ingestionTimestamp, filters.end) : undefined
        ));

        const events = await query;
        console.log(`[ReplayService] Triggering replay for ${events.length} events...`);

        const results = {
            triggered: 0,
            failed: 0
        };

        for (const event of events) {
            try {
                await this.replayEvent(event.eventId);
                results.triggered++;
            } catch (err) {
                console.error(`[ReplayService] Failed to trigger replay for ${event.eventId}:`, err);
                results.failed++;
            }
        }

        return results;
    }
}
