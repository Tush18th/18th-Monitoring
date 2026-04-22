import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { 
    alerts, 
    alertRules, 
    iamAuditLogs, 
    systemLogs 
} from '../../../../packages/db/src/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { 
    SystemAlert, 
    AlertSeverity, 
    LogLevel, 
    StructuredLog 
} from '../../../../packages/shared-types/src';
import crypto from 'crypto';

export class ObservabilityService {
    
    /**
     * Requirement 1: Structured Logging
     * Persists a log entry with full operational context.
     */
    static async log(entry: Omit<StructuredLog, 'timestamp'>) {
        await db.insert(systemLogs).values({
            level: entry.level,
            module: entry.module,
            message: entry.message,
            siteId: entry.siteId,
            tenantId: (entry as any).tenantId || 'tenant_001',
            correlationId: entry.correlationId,
            metadata: entry.metadata || {}
        });

        // If ERROR or FATAL, automatically check if we should trigger an alert
        if (entry.level === 'ERROR' || entry.level === 'FATAL') {
            await this.triggerAlert({
                siteId: entry.siteId || 'SYSTEM',
                severity: entry.level === 'FATAL' ? 'CRITICAL' : 'WARNING',
                module: entry.module as any,
                alertType: 'ERROR_LOG_SPIKE',
                message: entry.message,
                context: entry.metadata,
                correlationId: entry.correlationId
            });
        }
    }

    /**
     * Requirement 7, 8, 10: Alert Rule Engine & Lifecycle
     */
    static async triggerAlert(alertData: Omit<SystemAlert, 'id' | 'status' | 'triggeredAt'>) {
        const id = crypto.randomUUID();
        
        // 1. DEDUPLICATION (Requirement 9)
        // Check if a similar alert is already active for this site/module/type
        const existing = await db.select().from(alerts).where(and(
            eq(alerts.siteId, alertData.siteId),
            eq(alerts.module, alertData.module),
            eq(alerts.alertType, alertData.alertType),
            eq(alerts.status, 'TRIGGERED')
        )).limit(1);

        if (existing[0]) {
            // Already triggered, could increment a counter in metadata
            return existing[0].id;
        }

        // 2. PERSIST NEW ALERT
        await db.insert(alerts).values({
            id,
            siteId: alertData.siteId,
            tenantId: (alertData as any).tenantId || 'tenant_001',
            severity: alertData.severity,
            module: alertData.module,
            alertType: alertData.alertType,
            message: alertData.message,
            context: alertData.context || {},
            correlationId: alertData.correlationId,
            status: 'TRIGGERED'
        });

        console.log(`[Alerting] Triggered ${alertData.severity} alert for ${alertData.siteId}: ${alertData.message}`);
        return id;
    }

    /**
     * Requirement 12: Immutable Audit Logging
     */
    static async audit(options: {
        siteId: string;
        tenantId?: string;
        actorId: string;
        action: string;
        entityType: string;
        entityId: string;
        previousValue?: any;
        newValue?: any;
        metadata?: Record<string, any>;
    }) {
        await db.insert(iamAuditLogs).values({
            tenantId: options.tenantId || 'tenant_001',
            actorId: options.actorId,
            action: options.action,
            targetType: options.entityType,
            targetId: options.entityId,
            metadata: {
                from: options.previousValue,
                to: options.newValue,
                ...options.metadata
            }
        });
    }

    /**
     * Requirement 10: Alert Resolution
     */
    static async resolveAlert(alertId: string, resolvedBy: string) {
        await db.update(alerts)
            .set({ 
                status: 'RESOLVED', 
                resolvedAt: new Date(),
                acknowledgedBy: resolvedBy 
            })
            .where(eq(alerts.id, alertId));
    }
}
