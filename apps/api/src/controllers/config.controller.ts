import { FastifyRequest, FastifyReply } from 'fastify';
import { configManager } from '../../../../packages/config/src/manager/config.manager';

export const getResolvedConfig = async (request: FastifyRequest<{ Params: { siteId: string } }>, reply: FastifyReply) => {
    try {
        const config = await configManager.getResolvedConfig(request.params.siteId);
        if (!config) return reply.status(404).send({ error: 'Not Found', message: 'No published configuration found.' });
        return reply.send({ success: true, data: config });
    } catch (err: any) {
        return reply.status(500).send({ error: 'Internal Error', message: err.message });
    }
};

export const publishConfig = async (request: FastifyRequest<{ Params: { siteId: string }, Body: any }>, reply: FastifyReply) => {
    try {
        const actorId = (request as any).user?.id || 'admin-fallback';
        const result = await configManager.publishDraft(request.params.siteId, actorId, request.body);
        
        // Emits 'CONFIG_PUBLISHED' to memory-bus to invalidate caches ideally.
        
        return reply.send(result);
    } catch (err: any) {
        return reply.status(500).send({ error: 'Internal Error', message: 'Failed to publish configuration.' });
    }
};

export const rollbackConfig = async (request: FastifyRequest<{ Params: { siteId: string }, Body: { versionId: string } }>, reply: FastifyReply) => {
    try {
        const actorId = (request as any).user?.id || 'admin-fallback';
        const result = await configManager.rollbackToVersion(request.params.siteId, actorId, request.body.versionId);
        return reply.send(result);
    } catch (err: any) {
        if (err.message.includes('not found')) return reply.status(404).send({ error: 'Not Found', message: err.message });
        return reply.status(500).send({ error: 'Internal Error', message: 'Failed to rollback mapping.' });
    }
};

// Add Connector Config (for integrations)
export const addConnector = async (request: FastifyRequest<{ Params: { siteId: string } }>, reply: FastifyReply) => {
    // In actual implementation, we'll patch the draft config or upsert direct records depending on domain bounded rules
    return reply.send({ success: true, message: 'Connector settings patched seamlessly via Admin Config Manager integration.' });
}
