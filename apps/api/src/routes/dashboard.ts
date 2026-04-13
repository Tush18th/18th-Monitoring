import { 
    getSummaries, 
    getAlerts, 
    getPerformanceSummary, 
    getPerformanceTrends, 
    getSlowestPages,
    getUserActivitySummary,
    getUserTrends,
    getTopPages,
    getFunnelData,
    getOrderSummary,
    getOrderTrends,
    getDelayedOrders,
    getOrderSourceBreakdown,
    getIntegrationHealthSummary,
    getSyncTrends,
    getFailedSyncs,
    getIntegrationSystemBreakdown
} from '../controllers/dashboard.controller';
import { tenantAuthHandler } from '../middlewares/auth.middleware';

export const dashboardRoutes = async (fastify: any) => {
    // API Prefix Mapping
    // Securely routes all data strictly mapped to authenticated tenants bounds
    fastify.addHook('preHandler', tenantAuthHandler);
    
    fastify.get('/summaries', getSummaries);
    fastify.get('/alerts', getAlerts);
    
    // Performance Endpoints
    fastify.get('/performance/summary', getPerformanceSummary);
    fastify.get('/performance/trends', getPerformanceTrends);
    fastify.get('/performance/slowest-pages', getSlowestPages);
    
    // User Activity Endpoints
    fastify.get('/users/summary', getUserActivitySummary);
    fastify.get('/users/trends', getUserTrends);
    fastify.get('/users/top-pages', getTopPages);
    fastify.get('/users/funnel', getFunnelData);
    
    // Order Activity Endpoints
    fastify.get('/orders/summary', getOrderSummary);
    fastify.get('/orders/trends', getOrderTrends);
    fastify.get('/orders/delayed', getDelayedOrders);
    fastify.get('/orders/source-breakdown', getOrderSourceBreakdown);
    
    // Integration Monitoring Endpoints
    fastify.get('/integrations/summary', getIntegrationHealthSummary);
    fastify.get('/integrations/trends', getSyncTrends);
    fastify.get('/integrations/failed', getFailedSyncs);
    fastify.get('/integrations/systems', getIntegrationSystemBreakdown);
};

