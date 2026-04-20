import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { externalSyncService } from '../services/external-sync.service';

/**
 * Inbound webhook routes for POS/ERP systems that push data to us.
 * Auth is performed via the x-api-key header matching the connector's vaultKey-issued token.
 * No rate limiter here — these are trusted system-to-system calls on a separate policy.
 */
import { IngestionService } from '../services/ingestion.service';
import { HardenedIngestionService } from '../services/hardened-ingestion.service';

export async function webhookRoutes(server: FastifyInstance) {

    // Helper to streamline webhook ingestion
    const ingestWebhook = async (request: FastifyRequest, connectorId: string, eventType: string, sourceEventId?: string) => {
        return HardenedIngestionService.ingest({
            siteId: 'store_001', // Ideally resolved from auth or path
            connectorId,
            sourceSystem: connectorId.split('_')[0],
            eventType,
            payload: request.body as any,
            sourceEventId,
            metadata: {
                correlationId: request.id,
                provenance: {
                    ip: request.ip,
                    ua: request.headers['user-agent']
                }
            }
        });
    };

    // POST /api/v1/webhooks/shopify/orders/create
    server.post('/shopify/orders/create', async (request: FastifyRequest<{ Body: Record<string, any> }>, reply: FastifyReply) => {
        try {
            const body = request.body;
            const result = await ingestWebhook(request, 'shopify_primary', 'orders/create', body.id?.toString());
            return reply.status(202).send({ accepted: true, eventId: result.eventId });
        } catch (err: any) {
            return reply.status(500).send({ error: 'Ingestion Error', message: err.message });
        }
    });

    // POST /api/v1/webhooks/shopify/orders/update
    server.post('/shopify/orders/update', async (request: FastifyRequest<{ Body: Record<string, any> }>, reply: FastifyReply) => {
        try {
            const body = request.body;
            const result = await ingestWebhook(request, 'shopify_primary', 'orders/update', body.id?.toString());
            return reply.status(202).send({ accepted: true, eventId: result.eventId });
        } catch (err: any) {
            return reply.status(500).send({ error: 'Ingestion Error', message: err.message });
        }
    });

    // POST /api/v1/webhooks/magento/orders/create
    server.post('/magento/orders/create', async (request: FastifyRequest<{ Body: Record<string, any> }>, reply: FastifyReply) => {
        try {
            const body = request.body;
            const result = await ingestWebhook(request, 'magento_primary', 'order_placed', body.entity_id?.toString());
            return reply.status(202).send({ accepted: true, eventId: result.eventId });
        } catch (err: any) {
            return reply.status(500).send({ error: 'Ingestion Error', message: err.message });
        }
    });

    // GENERIC CONNECTOR WEBHOOK
    server.post('/:connectorId', async (request: FastifyRequest<{ Params: { connectorId: string }; Body: any }>, reply: FastifyReply) => {
        try {
            const { connectorId } = request.params;
            const body = request.body;
            const result = await ingestWebhook(request, connectorId, 'generic_webhook', body.id?.toString() || body.order_id?.toString());
            return reply.status(202).send({ accepted: true, eventId: result.eventId });
        } catch (err: any) {
            return reply.status(500).send({ error: 'Ingestion Error', message: err.message });
        }
    });
}

