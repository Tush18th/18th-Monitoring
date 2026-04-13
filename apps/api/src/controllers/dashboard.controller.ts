import { DashboardService } from '../services/dashboard.service';

export const getSummaries = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        
        const data = await DashboardService.getKpiSummaries(filters as any);
        return res.code(200).send(data);

    } catch (err) {
        console.error('[DashboardController] Routing failure', err);
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getAlerts = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '24h' };
        
        const data = await DashboardService.getActiveAlerts(filters as any);
        return res.code(200).send(data);

    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getPerformanceSummary = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getPerformanceSummary(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getPerformanceTrends = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getPerformanceTrends(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getSlowestPages = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getSlowestPages(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getUserActivitySummary = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getUserActivitySummary(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getUserTrends = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getUserTrends(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getTopPages = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getTopPages(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getFunnelData = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getFunnelData(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getOrderSummary = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getOrderSummary(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getOrderTrends = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getOrderTrends(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getDelayedOrders = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getDelayedOrders(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getOrderSourceBreakdown = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getOrderSourceBreakdown(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getIntegrationHealthSummary = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getIntegrationHealthSummary(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getSyncTrends = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getSyncTrends(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getFailedSyncs = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getFailedSyncs(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};

export const getIntegrationSystemBreakdown = async (req: any, res: any) => {
    try {
        const filters = { siteId: req.siteId, timeRange: req.query.timeRange || '1h' };
        const data = await DashboardService.getIntegrationSystemBreakdown(filters as any);
        return res.code(200).send(data);
    } catch (err) {
        return res.code(500).send({ error: 'Internal API Server Error' });
    }
};
