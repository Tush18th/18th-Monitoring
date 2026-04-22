import { FastifyInstance } from 'fastify';
import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import { tenantAuthHandler } from '../middlewares/auth.middleware';
import { tenantIsolationGuard } from '../middlewares/tenant-isolation.middleware';
import { ResponseUtil } from '../utils/response';

export const pipelineRoutes = async (fastify: FastifyInstance) => {
    
    fastify.addHook('preHandler', tenantAuthHandler);
    fastify.addHook('preHandler', tenantIsolationGuard);

    // â”€â”€â”€ PIPELINE JOBS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * List recent pipeline jobs (Ingestion, Transformation, Aggregation) for the project.
     * Supports fetching running, completed, and failed jobs.
     */
    fastify.get('/tenants/:tenantId/projects/:siteId/pipeline/jobs', async (req, reply) => {
        const { siteId } = req.params as any;
        const jobs = GlobalMemoryStore.pipelineJobs.filter(j => j.siteId === siteId);
        
        return reply.send(ResponseUtil.success({
            jobs: jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }, {}, req.id as string));
    });

    /**
     * Get specific pipeline job details
     */
    fastify.get('/tenants/:tenantId/projects/:siteId/pipeline/jobs/:jobId', async (req, reply) => {
        const { jobId } = req.params as any;
        const job = GlobalMemoryStore.pipelineJobs.find(j => j.id === jobId);
        
        if (!job) {
            return reply.code(404).send(ResponseUtil.error([{ code: 'JOB_NOT_FOUND', message: 'Job not found' }], req.id as string));
        }

        return reply.send(ResponseUtil.success({ job }, {}, req.id as string));
    });

    // â”€â”€â”€ PIPELINE CHECKPOINTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * List current cursors/checkpoints for all project integrations.
     */
    fastify.get('/tenants/:tenantId/projects/:siteId/pipeline/checkpoints', async (req, reply) => {
        const { siteId } = req.params as any;
        
        const checkpoints = Array.from(GlobalMemoryStore.pipelineCheckpoints.values())
            .filter(c => c.siteId === siteId);

        return reply.send(ResponseUtil.success({ checkpoints }, {}, req.id as string));
    });


    // â”€â”€â”€ DEAD LETTER QUEUE (DLQ) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * List events stuck in the dead letter queue awaiting human intervention.
     */
    fastify.get('/tenants/:tenantId/projects/:siteId/pipeline/dlq', async (req, reply) => {
        const { siteId } = req.params as any;
        
        const deadLetters = GlobalMemoryStore.deadLetterQueue.filter(d => d.siteId === siteId && !d.actionTaken);

        return reply.send(ResponseUtil.success({
            DLQ: deadLetters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }, {}, req.id as string));
    });
};

