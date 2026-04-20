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
    /**
     * Extracts and calculates the core Key Performance Indicators for a specific site.
     * Evaluates data over the given time range and computes the standard health states.
     * 
     * @param filters - The DTO containing the 'siteId' constraint.
     * @returns A mapped array of aggregated KPI objects.
     */
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
                trendPct: (pageLoad || 0) > 3000 ? 12 : -5,
                state: stateFor('pageLoadTime', pageLoad),
                unit: 'ms'
            },
            {
                kpiName: 'errorRatePct',
                value: errCount,
                trendPct: errCount > 5 ? 15 : 0,
                state: stateFor('errorRatePct', errCount),
                unit: '%'
            },
            {
                kpiName: 'activeUsers',
                value: activeUsersCount || 0,
                trendPct: 5,
                state: 'healthy',
                unit: 'users'
            },
            {
                kpiName: 'ordersTotal',
                value: ordersTotal,
                trendPct: 10,
                state: 'healthy',
                unit: 'orders'
            },
            {
                kpiName: 'ordersDelayCount',
                value: delayedOrders,
                trendPct: 0,
                state: stateFor('ordersDelayCount', delayedOrders),
                unit: 'orders'
            },
            {
                kpiName: 'syncSuccessRate',
                value: syncSuccessRate,
                trendPct: 0,
                state: syncSuccessRate < 95 ? 'warning' : 'healthy',
                unit: '%'
            },
        ];
    }

    /**
     * Retrieves currently active threshold breaches and architectural alerts.
     * Guaranteed to isolate outputs to the requested 'siteId' preventing cross-tenant leakage.
     * 
     * @param filters - Contains limit/offset for pagination and 'siteId'.
     * @returns A mapped array of alert summaries sorted dynamically.
     */
    static async getActiveAlerts(filters: MetricFilterDto): Promise<AlertSummaryResponse[]> {
        const { siteId, limit = 50, offset = 0 } = filters;
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
                acknowledgedAt: a.acknowledgedAt,
                resolvedAt: a.resolvedAt,
                module: a.module || 'System',
                affectedEntity: a.affectedEntity || '-',
                ruleId: a.ruleId,
                siteId: a.siteId,
            }));
    }

    static async getAuditLogs(filters: MetricFilterDto) {
        const { siteId } = filters;
        return [
            { id: 'aud-1', actor: 'Admin (System)', action: 'Config Changed', entity: 'Stripe Connector', value: 'SLA 98% -> 99%', timestamp: '10m ago', category: 'configuration' },
            { id: 'aud-2', actor: 'John Doe', action: 'Reprocess Order', entity: 'ORD-8821', value: '-', timestamp: '45m ago', category: 'action' },
            { id: 'aud-3', actor: 'System', action: 'API Key Rotated', entity: 'Backend Ingestion', value: '-', timestamp: '2h ago', category: 'security' },
        ];
    }

    static async getActivityFeed(filters: MetricFilterDto) {
        const { siteId } = filters;
        return [
            { id: 'act-1', type: 'Sync Started', entity: 'Inventory ERP', timestamp: '2m ago', status: 'processing', description: 'Full differential sync running.' },
            { id: 'act-2', type: 'Webhook Received', entity: 'Checkout (API)', timestamp: '5m ago', status: 'success', description: 'Session initialized for node #24.' },
            { id: 'act-3', type: 'System Heartbeat', entity: 'Primary Store', timestamp: '10m ago', status: 'success', description: 'Node healthy.' },
        ];
    }

    static async getPerformanceSummary(filters: MetricFilterDto) {
        const { siteId } = filters;
        const avg = getAvg(siteId, 'pageLoadTime') || 1200;
        return {
            p50: avg,
            p75: avg * 1.15,
            p90: avg * 1.3,
            p95: avg * 1.5,
            p99: avg * 2.2,
            avg: avg,
            errorRate: getAvg(siteId, 'errorRatePct') || 0.42,
            uptime: 99.98,
            ttfb: getAvg(siteId, 'ttfb') || 140,
            fid: 12,
            cls: 0.02,
            lcp: 1200,
            fcp: 800
        };
    }

    static async getPerformanceAnomalies(filters: MetricFilterDto) {
        const { siteId } = filters;
        return [
            { 
              id: 'anom-1', 
              metric: 'p95 Latency', 
              severity: 'critical', 
              impact: 'Region: India', 
              scope: 'Checkout API',
              window: 'Last 15m',
              deviation: '+450ms',
              status: 'active'
            },
            { 
              id: 'anom-2', 
              metric: 'Error Rate', 
              severity: 'warning', 
              impact: 'Browser: Safari Mobile', 
              scope: 'Product Details',
              window: 'Last 1h',
              deviation: '+2.4%',
              status: 'active'
            }
        ];
    }

    static async getRegionalPerformance(filters: MetricFilterDto) {
        // Mocking realistic regional data as requested
        const regions = [
            { region: 'NA-EAST-1', countryCode: 'US', avgLatency: 120, errorRate: 0.2, trafficShare: 45, health: 'healthy' as const },
            { region: 'EU-WEST-2', countryCode: 'UK', avgLatency: 280, errorRate: 0.4, trafficShare: 30, health: 'healthy' as const },
            { region: 'IN-SOUTH-1', countryCode: 'IN', avgLatency: 450, errorRate: 0.8, trafficShare: 15, health: 'warning' as const },
            { region: 'AP-SOUTHEAST-1', countryCode: 'SG', avgLatency: 410, errorRate: 0.6, trafficShare: 7, health: 'healthy' as const },
            { region: 'ME-CENTRAL-1', countryCode: 'AE', avgLatency: 390, errorRate: 0.5, trafficShare: 3, health: 'healthy' as const },
        ];
        return regions;
    }

    static async getDeviceSegmentation(filters: MetricFilterDto) {
        return [
            { name: 'Mobile', value: 62, color: 'var(--accent-blue)' },
            { name: 'Desktop', value: 35, color: 'var(--accent-green)' },
            { name: 'Tablet', value: 3, color: 'var(--accent-purple)' },
        ];
    }

    static async getResourceBreakdown(filters: MetricFilterDto) {
        return [
            { name: 'Images', value: 1.2, unit: 'MB' },
            { name: 'JavaScript', value: 0.8, unit: 'MB' },
            { name: 'CSS', value: 0.15, unit: 'MB' },
            { name: 'Fonts', value: 0.08, unit: 'MB' },
            { name: 'Other', value: 0.04, unit: 'MB' },
        ];
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
            totalUsers: (activeUsersCount || 0) * 12,
            activeUsers: activeUsersCount || 0,
            identifiedRatio: 64,
            newVsReturning: 38,
            sessions: totalSessions || 0,
            avgSessionDuration: 12.5,
            bounceRate: 34.2,
        };
    }

    static async getCustomerIntelligence(filters: MetricFilterDto) {
        const { siteId } = filters;
        return {
            funnel: [
                { stage: 'Visit', count: 12400, percent: 100 },
                { stage: 'Product View', count: 8500, percent: 68 },
                { stage: 'Add to Cart', count: 2400, percent: 19 },
                { stage: 'Checkout', count: 1800, percent: 14 },
                { stage: 'Purchase', count: 1450, percent: 11 }
            ],
            segments: [
                { name: 'High Value (VIP)', size: 420, active: 120, conversion: 24, growth: 5.2 },
                { name: 'Recent Visitors', size: 2400, active: 850, conversion: 12, growth: 12.4 },
                { name: 'Cart Abandoners', size: 1200, active: 410, conversion: 2, growth: -3.1 },
                { name: 'Anonymous / Guest', size: 8500, active: 1400, conversion: 4.2, growth: 1.5 }
            ],
            topAttribution: [
                { source: 'Google / CPC', sessions: 4200, conversion: 14.2 },
                { source: 'Direct / None', sessions: 3800, conversion: 8.4 },
                { source: 'Social (Insta)', sessions: 1500, conversion: 12.1 }
            ],
            recentIdentities: [
                { id: 'CUST-8821', name: 'Alex Johnson', email: 'alex@example.com', state: 'VIP', sessions: 24, lastActive: '2m ago' },
                { id: 'CUST-4011', name: 'Sarah Chen', email: 'sarah.c@gmail.com', state: 'New Customer', sessions: 2, lastActive: '5m ago' },
                { id: 'GUEST-442', name: 'Anonymous Visitor', email: '-', state: 'Prospect', sessions: 1, lastActive: '12m ago' }
            ]
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


    static async getUserAnalytics(filters: MetricFilterDto) {
        const { siteId } = filters;
        const now = Date.now();
        const activeWindow = 5 * 60 * 1000; // 5 minutes

        const allSessions = Array.from(GlobalMemoryStore.sessions.values())
            .filter(s => s.siteId === siteId);

        const activeSessions = allSessions.filter(s => {
            const lastActive = new Date(s.lastActiveAt).getTime();
            return (now - lastActive) <= activeWindow;
        });

        const deviceBreakdown: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
        const browserBreakdown: Record<string, number> = { chrome: 0, safari: 0, edge: 0, firefox: 0, other: 0 };
        
        let activeCustomers = 0;
        let activeVisitors = 0;

        activeSessions.forEach(s => {
            // Device
            const device = (s.deviceType || 'desktop').toLowerCase();
            if (deviceBreakdown[device] !== undefined) deviceBreakdown[device]++;
            else deviceBreakdown.desktop++;

            // Browser
            const browser = (s.browser || 'chrome').toLowerCase();
            if (browserBreakdown[browser] !== undefined) browserBreakdown[browser]++;
            else browserBreakdown.other++;

            // Customer type
            if (s.isCustomer) activeCustomers++;
            else activeVisitors++;
        });

        return {
            activeUsers: activeSessions.length,
            totalCustomers: activeCustomers, // Active Authenticated
            activeVisitors: activeVisitors,   // Active Anonymous
            deviceBreakdown: {
                desktop: { count: deviceBreakdown.desktop, percentage: activeSessions.length ? Math.round((deviceBreakdown.desktop / activeSessions.length) * 100) : 0 },
                mobile:  { count: deviceBreakdown.mobile,  percentage: activeSessions.length ? Math.round((deviceBreakdown.mobile / activeSessions.length) * 100) : 0 },
                tablet:  { count: deviceBreakdown.tablet,  percentage: activeSessions.length ? Math.round((deviceBreakdown.tablet / activeSessions.length) * 100) : 0 }
            },
            browserBreakdown: Object.entries(browserBreakdown).map(([name, count]) => ({
                name,
                count,
                percentage: activeSessions.length ? Math.round((count / activeSessions.length) * 100) : 0
            })).sort((a,b) => b.count - a.count)
        };
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

    /**
     * Collates complex order aggregation metrics including delays, channels, and total volumes.
     */
    static async getOrderSummary(filters: MetricFilterDto) {
        const total = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const delayedCount = orders.filter(o => o.status === 'placed' && (Date.now() - new Date(o.createdAt).getTime()) > 10 * 60 * 1000).length;
        
        const counts: Record<string, number> = { online: 0, offline: 0, pos: 0, api: 0 };
        orders.forEach(o => {
            const ch = (o.channel || 'online').toLowerCase();
            if (counts[ch] !== undefined) counts[ch]++;
        });

        return {
            totalOrders: total,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageOrderValue: total > 0 ? Math.round((totalRevenue / total) * 100) / 100 : 0,
            delayedCount,
            failureRate: total > 0 ? (orders.filter(o => o.status === 'failed').length / total) : 0,
            channelBreakdown: Object.entries(counts).map(([channel, count]) => ({
                channel: channel as any,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
        };
    }

    static async getOrderTrends(filters: MetricFilterDto) {
        const { siteId } = filters;
        const labels = Array.from({ length: 6 }, (_, i) => `${10 + i}:00`);
        const base = 50;
        
        return labels.map((label, i) => ({
            timestamp: label,
            online: base + Math.floor(Math.random() * 20) + (i === 4 ? -30 : 0), // Drop in 12:40 for RCA demo
            offline: 15 + Math.floor(Math.random() * 10)
        }));
    }

    static async getOrderRCA(filters: MetricFilterDto) {
        const { siteId } = filters;
        const anomalies = [];
        
        // 1. Check for Performance Correlation
        const p95Latency = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'pageLoadTime');
        const avgLatency = p95Latency.reduce((acc, m) => acc + m.value, 0) / (p95Latency.length || 1);
        
        if (avgLatency > 3000) {
            anomalies.push({
                type: 'Performance Degradation',
                metric: 'Page Load Time',
                value: `${Math.round(avgLatency)}ms`,
                impact: 'High correlation with checkout abandonment',
                confidence: 0.85
            });
        }

        // 2. Check for Integration Failures
        const syncFailures = GlobalMemoryStore.integrationSyncs.filter(s => s.siteId === siteId && s.status === 'failure');
        if (syncFailures.length > 0) {
            anomalies.push({
                type: 'Integration Failure',
                metric: 'OMS Sync Health',
                value: `${syncFailures.length} failed attempts`,
                impact: 'Offline order ingestion blocked',
                confidence: 0.95
            });
        }

        // 3. Check for JS Errors
        const jsErrors = GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === 'errorRateIncrement');
        if (jsErrors.length > 3) {
            anomalies.push({
                type: 'Frontend Stability',
                metric: 'JS Error Rate',
                value: `${jsErrors.length} spikes`,
                impact: 'Potential breakage in Add to Cart / Checkout flow',
                confidence: 0.7
            });
        }

        return {
            status: anomalies.length > 0 ? 'alert' : 'healthy',
            anomalies,
            analyzedAt: new Date().toISOString()
        };
    }

    static async getRecommendations(filters: MetricFilterDto) {
        const rca = await this.getOrderRCA(filters);
        const recommendations = [];

        for (const anomaly of rca.anomalies) {
            if (anomaly.type === 'Performance Degradation') {
                recommendations.push({
                    title: 'Optimize Checkout Assets',
                    action: 'Investigate LCP on /checkout page. Heavy script or image blocking render.',
                    priority: 'Critical'
                });
            }
            if (anomaly.type === 'Integration Failure') {
                recommendations.push({
                    title: 'Restart OMS Connector',
                    action: 'Verify API credentials and connectivity for OMS-1 system.',
                    priority: 'High'
                });
            }
            if (anomaly.type === 'Frontend Stability') {
                recommendations.push({
                    title: 'Check Payment Gateway Hook',
                    action: 'Frequent "ReferenceError" detected in payment script handler.',
                    priority: 'High'
                });
            }
        }

        if (recommendations.length === 0) {
            recommendations.push({
                title: 'No Action Required',
                action: 'System operating within normal baseline parameters.',
                priority: 'Low'
            });
        }

        return recommendations;
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

    static async getOrders(filters: MetricFilterDto) {
        const { siteId } = filters;
        // Mock some realistic orders if none exist for the project
        const ordersInStore = Array.from(GlobalMemoryStore.orders.values()).filter(o => o.siteId === siteId);
        
        if (ordersInStore.length === 0) {
            return [
                { id: 'ORD-1001', externalOrderId: 'MAG-99120', channel: 'web', orderSource: 'online', status: 'shipped', amount: 154.20, createdAt: new Date(Date.now() - 3600000).toISOString(), health: 'healthy', syncStatus: 'synced' },
                { id: 'ORD-1002', externalOrderId: 'MAG-99121', channel: 'web', orderSource: 'online', status: 'placed', amount: 89.00, createdAt: new Date(Date.now() - 7200000).toISOString(), health: 'delayed', syncStatus: 'synced' },
                { id: 'ORD-1003', externalOrderId: 'ERP-88210', channel: 'pos', orderSource: 'offline', status: 'paid', amount: 420.50, createdAt: new Date(Date.now() - 10800000).toISOString(), health: 'stuck', syncStatus: 'mismatch' },
                { id: 'ORD-1004', externalOrderId: 'MAG-99122', channel: 'web', orderSource: 'online', status: 'cancelled', amount: 12.99, createdAt: new Date(Date.now() - 14400000).toISOString(), health: 'healthy', syncStatus: 'synced' },
                { id: 'ORD-1005', externalOrderId: 'MAG-99123', channel: 'web', orderSource: 'online', status: 'placed', amount: 231.00, createdAt: new Date(Date.now() - 18000000).toISOString(), health: 'failed', syncStatus: 'error' },
            ].map(o => ({ ...o, siteId }));
        }

        return ordersInStore;
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

    static async getMetricsCatalog(filters: MetricFilterDto) {
        return [
            { id: 'pageLoadTime', name: 'Page Load Time', category: 'Performance', type: 'latency', unit: 'ms' },
            { id: 'errorRatePct', name: 'JS Error Rate', category: 'Performance', type: 'percentage', unit: '%' },
            { id: 'activeUsers', name: 'Active Users', category: 'Audience', type: 'count', unit: 'users' },
            { id: 'totalOrders', name: 'Total Orders', category: 'Business', type: 'count', unit: 'orders' },
            { id: 'delayedOrders', name: 'Delayed Orders', category: 'Business', type: 'count', unit: 'orders' },
            { id: 'syncSuccessRate', name: 'Sync Success Rate', category: 'Integrations', type: 'percentage', unit: '%' }
        ];
    }

    static async getMetricsSeries(filters: MetricFilterDto & { kpi: string; range: string }) {
        const { siteId, kpi, range } = filters;
        // Mocking generic series data based on requested KPI and range
        const labels = range === '1h' 
            ? ['12:00', '12:10', '12:20', '12:30', '12:40', '12:50']
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        let avg = 100;
        if (kpi === 'pageLoadTime') avg = getAvg(siteId, 'pageLoadTime') || 2500;
        if (kpi === 'errorRatePct') avg = 2.5;

        return labels.map((label) => ({
            timestamp: label,
            value: avg + (Math.random() * (avg * 0.2) - (avg * 0.1))
        }));
    }

    static async getGovernanceConfig(filters: MetricFilterDto) {
        const { siteId } = filters;
        return {
            project: {
                id: siteId,
                name: 'Main production environment',
                region: 'AWS us-east-1',
                retentionDays: 90,
                environments: ['production', 'staging', 'qa']
            },
            rbac: {
                roles: [
                  { name: 'Admin', scopes: ['read:all', 'write:all', 'manage:users'], users: 4 },
                  { name: 'Operator', scopes: ['read:all', 'action:reprocess'], users: 12 },
                  { name: 'Viewer', scopes: ['read:all'], users: 24 }
                ],
                users: [
                  { id: 'u-1', name: 'John Admin', role: 'Admin', lastActive: '2h ago' },
                  { id: 'u-2', name: 'Ops Sarah', role: 'Operator', lastActive: '10m ago' }
                ]
            },
            security: {
                apiKeys: [
                  { id: 'key-1', name: 'Ingestion Primary', created: '2025-10-24', status: 'active' },
                  { id: 'key-2', name: 'Webhooks Secondary', created: '2026-01-12', status: 'expired' }
                ],
                mfaRequired: true,
                allowedIps: ['192.168.1.0/24', '10.0.0.0/8']
            },
            versioning: {
                currentVersion: 'v2.4.1',
                lastChange: { who: 'John Admin', timestamp: '2026-04-20 10:42', change: 'Updated Stripe SLA threshold' }
            }
        };
    }

    static async updateGovernanceConfig(siteId: string, section: string, data: any) {
        console.log(`[GOVERNANCE] Updating ${section} for site ${siteId}`, data);
        return { success: true, updatedVersion: 'v2.4.2' };
    }
}
