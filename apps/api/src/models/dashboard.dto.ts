export interface KpiSummaryResponse {
    kpiName: string;
    value: number;
    trendPct: number;
    state: 'healthy' | 'warning' | 'critical';
}

export interface MetricFilterDto {
    siteId: string;
    timeRange: '1h' | '24h' | '7d';
    region?: string;
    source?: string;
    limit?: number;
    offset?: number;
}

export interface AlertSummaryResponse {
    alertId: string;
    kpiName: string;
    severity: string;
    status: string;
    message: string;
    triggeredAt: string;
}
