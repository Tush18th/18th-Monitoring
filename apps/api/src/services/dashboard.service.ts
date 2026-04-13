import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import type { MetricFilterDto, KpiSummaryResponse, AlertSummaryResponse } from '../models/dashboard.dto';

// Computes the numeric average of a KPI from the in-memory store
function getAvg(siteId: string, kpiName: string): number | null {
    const records = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === kpiName);
    if (records.length === 0) return null;
    const sum = records.reduce((s, r) => s + r.value, 0);
    return Math.round(sum / records.length);
}

function getCount(siteId: string, kpiName: string): number {
    return GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === kpiName).length;
}

function stateFor(kpiName: string, val: number | null): 'healthy' | 'warning' | 'critical' {
    if (val === null || val === 0) return 'healthy';
    if (kpiName === 'pageLoadTime') {
        if (val > 4000) return 'critical';
        if (val > 3000) return 'warning';
    }
    if (kpiName === 'errorRatePct') {
        if (val > 4) return 'critical';
        if (val >= 2) return 'warning';
    }
    if (kpiName === 'oms_sync_failed_count') {
        if (val > 2) return 'critical';
        if (val >= 1) return 'warning';
    }
    return 'healthy';
}

export class DashboardService {
    static async getKpiSummaries(filters: MetricFilterDto): Promise<KpiSummaryResponse[]> {
        const { siteId } = filters;

        // Performance
        const pageLoad  = getAvg(siteId, 'pageLoadTime');
        const errCount  = getCount(siteId, 'errorRatePct');
        
        // Users
        const activeUsersCount = new Set(
            GlobalMemoryStore.metrics
                .filter(m => m.siteId === siteId && m.kpiName === 'activeUsersIncrement' && m.dimensions?.action === 'active')
                .map(m => m.dimensions?.sessionId)
        ).size;
        
        // Orders
        const ordersTotal = Array.from(GlobalMemoryStore.orders.values()).filter(o => o.siteId === siteId).length;
        const delayedOrders = Array.from(GlobalMemoryStore.orders.values()).filter(o => o.siteId === siteId && o.status === 'placed').length;

        // Integrations
        const totalSuccessful = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'syncSuccessPing').length;
        const totalFailed = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'syncFailurePing').length;
        const totalSyncs = totalSuccessful + totalFailed;
        const syncSuccessRate = totalSyncs > 0 ? Math.round((totalSuccessful / totalSyncs) * 100) : 100;

        return [
            {
                kpiName: 'pageLoadTime',
                value: pageLoad ?? 0,
                trendPct: (pageLoad || 0) > 3000 ? +12 : -5,
                state: stateFor('pageLoadTime', pageLoad),
            },
            {
                kpiName: 'errorRatePct',
                value: errCount,
                trendPct: errCount > 5 ? +15 : 0,
                state: stateFor('errorRatePct', errCount),
            },
            {
                kpiName: 'activeUsers',
                value: activeUsersCount || 0,
                trendPct: +5,
                state: 'healthy',
            },
            {
                kpiName: 'ordersTotal',
                value: ordersTotal,
                trendPct: +10,
                state: 'healthy',
            },
            {
                kpiName: 'ordersDelayCount',
                value: delayedOrders,
                trendPct: 0,
                state: stateFor('ordersDelayCount', delayedOrders),
            },
            {
                kpiName: 'syncSuccessRate',
                value: syncSuccessRate,
                trendPct: 0,
                state: syncSuccessRate < 95 ? 'warning' : 'healthy',
            },
        ];
    }

    static async getActiveAlerts(filters: MetricFilterDto): Promise<AlertSummaryResponse[]> {
        const { siteId, limit = 50, offset = 0 } = filters;
        // ⚠️ Critical: filter by siteId to prevent cross-tenant data leakage
        return GlobalMemoryStore.alerts
            .filter((a: any) => a.siteId === siteId)
            .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
            .slice(offset, offset + limit)
            .map((a: any) => ({
                alertId: a.alertId,
                kpiName: a.kpiName,
                severity: a.severity,
                status: a.status || 'active',
                message: a.message,
                triggeredAt: a.triggeredAt,
                ruleId: a.ruleId,
                siteId: a.siteId,
            }));
    }

    static async getPerformanceSummary(filters: MetricFilterDto) {
        const { siteId } = filters;
        return {
            avgLoadTime: getAvg(siteId, 'pageLoadTime') || 0,
            p95LoadTime: (getAvg(siteId, 'pageLoadTime') || 0) * 1.25, // Mocked P95
            ttfb: getAvg(siteId, 'ttfb') || 0,
            fcp: getAvg(siteId, 'fcp') || 0,
            lcp: getAvg(siteId, 'lcp') || 0,
            uptime: 99.98, // Mocked uptime
        };
    }

    static async getPerformanceTrends(filters: MetricFilterDto) {
        const { siteId } = filters;
        // Mocking trend data for the last 6 points
        const labels = ['12:00', '12:10', '12:20', '12:30', '12:40', '12:50'];
        const avg = getAvg(siteId, 'pageLoadTime') || 2500;
        
        return labels.map((label, i) => ({
            timestamp: label,
            pageLoadTime: avg + (Math.random() * 200 - 100),
            ttfb: (avg * 0.2) + (Math.random() * 50 - 25),
            fcp: (avg * 0.4) + (Math.random() * 100 - 50),
            lcp: (avg * 0.8) + (Math.random() * 150 - 75),
        }));
    }

    static async getSlowestPages(filters: MetricFilterDto) {
        const { siteId } = filters;
        const records = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'pageLoadTime');
        
        // Group by URL and average
        const urlMap: Record<string, { total: number, count: number }> = {};
        records.forEach(r => {
            const url = r.dimensions?.url || '/unknown';
            if (!urlMap[url]) urlMap[url] = { total: 0, count: 0 };
            urlMap[url].total += r.value;
            urlMap[url].count += 1;
        });

        return Object.entries(urlMap)
            .map(([url, data]) => ({
                url,
                avgLoadTime: Math.round(data.total / data.count),
                status: (data.total / data.count) > 4000 ? 'critical' : (data.total / data.count) > 3000 ? 'warning' : 'healthy'
            }))
            .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
            .slice(0, 5);
    }

    static async getUserActivitySummary(filters: MetricFilterDto) {
        const { siteId } = filters;
        const activeUsersCount = new Set(
            GlobalMemoryStore.metrics
                .filter(m => m.siteId === siteId && m.kpiName === 'activeUsersIncrement' && m.dimensions?.action === 'active')
                .map(m => m.dimensions?.sessionId)
        ).size;

        const totalSessions = getCount(siteId, 'sessionsPerMinuteIncrement');

        return {
            activeUsers: activeUsersCount || 0,
            totalSessions: totalSessions || 0,
            avgSessionDuration: 12.5, // Mocked minutes
            bounceRate: 34.2, // Mocked percentage
        };
    }

    static async getUserTrends(filters: MetricFilterDto) {
        const { siteId } = filters;
        const labels = ['12:00', '12:10', '12:20', '12:30', '12:40', '12:50'];
        const sessionsBase = getCount(siteId, 'sessionsPerMinuteIncrement') || 10;
        
        return labels.map((label) => ({
            timestamp: label,
            sessions: sessionsBase + Math.floor(Math.random() * 5),
            activeUsers: (sessionsBase * 2.5) + Math.floor(Math.random() * 10),
            pageViews: (sessionsBase * 4) + Math.floor(Math.random() * 20),
        }));
    }

    static async getTopPages(filters: MetricFilterDto) {
        const { siteId } = filters;
        const records = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'userPageViewCount');
        
        const urlMap: Record<string, number> = {};
        records.forEach(r => {
            const url = r.dimensions?.url || '/';
            urlMap[url] = (urlMap[url] || 0) + 1;
        });

        return Object.entries(urlMap)
            .map(([url, count]) => ({ url, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    static async getFunnelData(_filters: MetricFilterDto) {
        // Mocked funnel for visualization
        return [
            { step: 'Landing Page', count: 1200, percentage: 100 },
            { step: 'Product View', count: 850, percentage: 70 },
            { step: 'Add to Cart', count: 320, percentage: 26 },
            { step: 'Checkout', count: 180, percentage: 15 },
            { step: 'Purchase', count: 110, percentage: 9 }
        ];
    }

    static async getOrderSummary(filters: MetricFilterDto) {
        const { siteId } = filters;
        const orders = Array.from(GlobalMemoryStore.orders.values()).filter(o => o.siteId === siteId);
        
        const total = orders.length;
        const onlineCount = orders.filter(o => o.channel !== 'pos').length;
        const offlineCount = total - onlineCount;
        
        const delayedCount = orders.filter(o => {
            const placedAt = new Date(o.placedAt).getTime();
            const now = new Date().getTime();
            // In a real system this would be 60 min, but for the demo we'll use a smaller window or just check status
            return o.status === 'placed' && (now - placedAt) > 5 * 1000; // 5 seconds for demo
        }).length;

        return {
            totalOrders: total,
            ordersPerMinute: (total / 60).toFixed(2), // Mocked for time range
            onlineSplit: total > 0 ? Math.round((onlineCount / total) * 100) : 0,
            offlineSplit: total > 0 ? Math.round((offlineCount / total) * 100) : 0,
            delayedOrders: delayedCount,
        };
    }

    static async getOrderTrends(filters: MetricFilterDto) {
        const { siteId } = filters;
        const labels = ['12:00', '12:10', '12:20', '12:30', '12:40', '12:50'];
        const total = Array.from(GlobalMemoryStore.orders.values()).filter(o => o.siteId === siteId).length || 50;
        
        return labels.map((label) => ({
            timestamp: label,
            orders: Math.floor(total / 6) + Math.floor(Math.random() * 5),
            revenue: Math.floor(Math.random() * 5000) + 2000,
        }));
    }

    static async getDelayedOrders(filters: MetricFilterDto) {
        const { siteId } = filters;
        return Array.from(GlobalMemoryStore.orders.entries())
            .filter(([_, o]) => o.siteId === siteId && o.status === 'placed')
            .map(([orderId, o]) => ({
                orderId,
                placedAt: o.placedAt,
                channel: o.channel,
                minutesDelayed: Math.floor((new Date().getTime() - new Date(o.placedAt).getTime()) / 60000) || 1
            }))
            .slice(0, 10);
    }

    static async getOrderSourceBreakdown(filters: MetricFilterDto) {
        const { siteId } = filters;
        const orders = Array.from(GlobalMemoryStore.orders.values()).filter(o => o.siteId === siteId);
        
        const channels: Record<string, number> = { 'Web': 0, 'Mobile': 0, 'POS': 0, 'API': 0 };
        orders.forEach(o => {
            const ch = o.channel.charAt(0).toUpperCase() + o.channel.slice(1);
            channels[ch] = (channels[ch] || 0) + 1;
        });

        return Object.entries(channels).map(([name, value]) => ({ name, value }));
    }

    static async getIntegrationHealthSummary(filters: MetricFilterDto) {
        const { siteId } = filters;
        const totalSuccessful = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'syncSuccessPing').length || 450;
        const totalFailed = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'syncFailurePing').length || 12;
        const total = totalSuccessful + totalFailed;
        
        return {
            successRate: total > 0 ? Math.round((totalSuccessful / total) * 100) : 98,
            failureCount24h: totalFailed,
            avgOmsLatency: 420, // Mocked ms
            healthScore: 95, // Mocked percentage
        };
    }

    static async getSyncTrends(filters: MetricFilterDto) {
        const { siteId } = filters;
        const labels = ['12:00', '12:10', '12:20', '12:30', '12:40', '12:50'];
        
        return labels.map((label) => ({
            timestamp: label,
            success: 80 + Math.floor(Math.random() * 20),
            failure: Math.floor(Math.random() * 5),
        }));
    }

    static async getFailedSyncs(filters: MetricFilterDto) {
        const { siteId } = filters;
        return GlobalMemoryStore.metrics
            .filter(m => m.siteId === siteId && m.kpiName === 'syncFailurePing')
            .map((m, idx) => ({
                id: `f_${idx}_${m.timestamp?.slice(11, 19)?.replace(/:/g, '') || Math.random().toString(36).slice(2, 7)}`,
                system: m.dimensions?.systemName || 'OMS',
                error: m.dimensions?.details || 'Connection timed out',
                timestamp: m.timestamp || new Date().toISOString()
            }))
            .slice(0, 5);
    }

    static async getIntegrationSystemBreakdown(_filters: MetricFilterDto) {
        // Mocked system list for visualization
        return [
            { name: 'Order Management (OMS)', status: 'Active', latency: '420ms', health: 98 },
            { name: 'ERP Sync (SAP)', status: 'Active', latency: '1200ms', health: 100 },
            { name: 'CRM Connector', status: 'Degraded', latency: '3500ms', health: 82 },
            { name: 'Payment Gateway', status: 'Active', latency: '150ms', health: 100 },
            { name: 'Email Provider', status: 'Offline', latency: 'N/A', health: 0 },
        ];
    }
}
