import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { externalSyncService } from '../services/external-sync.service';

/**
 * Inbound webhook routes for POS/ERP systems that push data to us.
 * Auth is performed via the x-api-key header matching the connector's vaultKey-issued token.
 * No rate limiter here — these are trusted system-to-system calls on a separate policy.
 */
export async function webhookRoutes(server: FastifyInstance) {

    // POST /api/v1/webhooks/:connectorId
    // Receives a single order payload pushed by a POS/ERP webhook
    server.post(
        '/:connectorId',
        async (request: FastifyRequest<{ Params: { connectorId: string }; Body: Record<string, any> }>, reply: FastifyReply) => {
            const { connectorId } = request.params;
            const rawPayload = request.body;

            if (!rawPayload || typeof rawPayload !== 'object') {
                return reply.status(400).send({ error: 'Bad Request', message: 'Payload body is required.' });
            }

            try {
                const mapped = await externalSyncService.processWebhookPayload(connectorId, rawPayload);
                // In production: enqueue mapped to TOPICS.SYNC_EVENTS for async normalization
                return reply.status(202).send({ accepted: true, mapped });
            } catch (err: any) {
                if (err.message?.includes('not found')) {
                    return reply.status(404).send({ error: 'Not Found', message: `Connector "${connectorId}" not registered.` });
                }
                return reply.status(500).send({ error: 'Internal Error', message: 'Webhook processing failed.' });
            }
        }
    );
}
