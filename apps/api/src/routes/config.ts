import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getResolvedConfig, publishConfig, rollbackConfig, addConnector } from '../controllers/config.controller';
import { tenantAuthHandler } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/rbac.middleware';
import { tenantIsolationGuard } from '../middlewares/tenant-isolation.middleware';
import { idempotencyGuard } from '../middlewares/idempotency.middleware';

export async function configRoutes(server: FastifyInstance) {
    server.get('/:siteId/config/resolved',{ preHandler: [tenantAuthHandler, tenantIsolationGuard] }, getResolvedConfig);

    // Mutating endpoints require idempotency key to prevent double-publishes
    server.post('/:siteId/config/publish',  { preHandler: [tenantAuthHandler, tenantIsolationGuard, roleGuard(['ADMIN', 'SUPER_ADMIN']), idempotencyGuard] }, publishConfig);

    server.post('/:siteId/config/rollback', { preHandler: [tenantAuthHandler, tenantIsolationGuard, roleGuard(['ADMIN', 'SUPER_ADMIN']), idempotencyGuard] }, rollbackConfig);

    server.post('/:siteId/connectors', { preHandler: [tenantAuthHandler, tenantIsolationGuard, roleGuard(['ADMIN', 'SUPER_ADMIN'])] }, addConnector);
}

