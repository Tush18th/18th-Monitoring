import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import crypto from 'crypto';

/**
 * AlertingEngine
 * 
 * Objective: 
 * Real-time monitoring of system signals to detect anomalies and failures.
 * Generates actionable 'Alert' entities.
 */
export class AlertingEngine {
    
    /**
     * Scans for critical failures in the last 60 minutes.
     */
    public static async runMonitoringCycle() {
        console.log('[ALERTING] Starting proactive monitoring cycle...');
        
        await this.checkIntegrationFailures();
        await this.checkIngestionLag();
        await this.checkDataQualityDegradation();
    }

    private static async checkIntegrationFailures() {
        const syncs = GlobalMemoryStore.integrationSyncs || [];
        const recentFailures = syncs.filter(s => 
            s.status === 'failure' && 
            new Date(s.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
        );

        for (const failure of recentFailures) {
            this.createAlert({
                siteId: failure.siteId,
                title: `Integration Sync Failed: ${failure.system}`,
                description: `A critical sync failed for ${failure.system}. Possible API rate limit or credential expiry.`,
                severity: 'high',
                category: 'INTEGRATION'
            });
        }
    }

    private static async checkIngestionLag() {
        const pendingEvents = GlobalMemoryStore.ingestionLogs.filter(e => e.processingStatus === 'PENDING');
        
        if (pendingEvents.length > 50) {
            this.createAlert({
                siteId: 'global',
                title: 'Ingestion Backlog Detected',
                description: `Current backlog of ${pendingEvents.length} events exceeds threshold. Scaling processing-engine recommended.`,
                severity: 'medium',
                category: 'PERFORMANCE'
            });
        }
    }

    private static async checkDataQualityDegradation() {
        const lowQualityOrders = Array.from(GlobalMemoryStore.orders.values())
            .filter(o => (o.qualityScore || 100) < 50);
        
        if (lowQualityOrders.length > 0) {
            this.createAlert({
                siteId: 'global',
                title: 'Critical Data Quality Degradation',
                description: `Found ${lowQualityOrders.length} orders failing quality gates. Check normalization mapping.`,
                severity: 'critical',
                category: 'DATA_INTEGRITY'
            });
        }
    }

    private static createAlert(params: { siteId: string, title: string, description: string, severity: 'low'|'medium'|'high'|'critical', category: string }) {
        const alert = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'active',
            ...params
        };

        if (!GlobalMemoryStore.alerts) GlobalMemoryStore.alerts = [];
        
        // Prevent duplicate spam
        const exists = GlobalMemoryStore.alerts.find(a => a.title === alert.title && a.status === 'active');
        if (!exists) {
            GlobalMemoryStore.alerts.push(alert);
            console.warn(`[ALERT GENERATED] ${alert.severity.toUpperCase()}: ${alert.title}`);
        }
    }
}
