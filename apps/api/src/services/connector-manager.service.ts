import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { 
    connectorInstances, 
    connectorHealthSnapshots, 
    connectorSyncRuns 
} from '../../../../packages/db/src/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { 
    ConnectorLifecycleState, 
    ConnectorHealthDimensions,
    IntegrationCategory
} from '../../../../packages/shared-types/src';

export class ConnectorManagerService {
    /**
     * Records a health signal for a specific dimension.
     * Requirement 3 (Multidimensional Health Model)
     */
    static async recordHealthSignal(connectorId: string, dimension: keyof ConnectorHealthDimensions, isHealthy: boolean, error?: any) {
        // In production:
        // 1. Fetch current health dimensions for this connector
        // 2. Update the specific dimension
        // 3. Recompute overall status
        // 4. If status changed, Log to connectorHealthSnapshots and auditLogs
        console.log(`[ConnectorManager] Health signal for ${connectorId}: ${dimension} = ${isHealthy}`);
    }

    /**
     * Transitions a connector through its lifecycle.
     * Requirement 2 (Formal lifecycle states)
     */
    static async transitionState(connectorId: string, newState: ConnectorLifecycleState) {
        const timestamp = new Date();
        try {
            await db.update(connectorInstances)
                .set({ 
                    lifecycleState: newState,
                    updatedAt: timestamp
                })
                .where(eq(connectorInstances.connectorId, connectorId));
            
            console.log(`[ConnectorManager] Connector ${connectorId} transitioned to ${newState}`);
        } catch (err) {
            console.error(`[ConnectorManager] Failed to transition connector ${connectorId}:`, err);
        }
    }

    /**
     * Starts a sync run.
     * Requirement 5 (Harden polling and sync orchestration)
     */
    static async startSyncRun(connectorId: string, siteId: string, syncType: 'POLL' | 'WEBHOOK' | 'BACKFILL') {
        const runId = Math.random().toString(36).substring(7);
        try {
            await db.insert(connectorSyncRuns).values({
                connectorId,
                siteId,
                syncType,
                status: 'PROCESSING',
                startedAt: new Date(),
            });

            await db.update(connectorInstances)
                .set({ lastAttemptAt: new Date() })
                .where(eq(connectorInstances.connectorId, connectorId));

            return runId;
        } catch (err) {
            console.error(`[ConnectorManager] Failed to start sync run for ${connectorId}:`, err);
            return null;
        }
    }

    /**
     * Completes a sync run with summary metrics.
     */
    static async completeSyncRun(connectorId: string, siteId: string, metrics: { fetched: number, processed: number, rejected: number, checkpoint?: string }) {
        const timestamp = new Date();
        try {
            // Update last successful sync
            await db.update(connectorInstances)
                .set({ 
                    lastSyncAt: timestamp,
                    healthStatus: 'HEALTHY',
                    lifecycleState: metrics.rejected > 0 ? 'DEGRADED' : 'ACTIVE'
                })
                .where(eq(connectorInstances.connectorId, connectorId));

            // Record success signal
            await this.recordHealthSignal(connectorId, 'sync', true);
        } catch (err) {
            console.error(`[ConnectorManager] Failed to complete sync run for ${connectorId}:`, err);
        }
    }

    /**
     * Computes freshness status based on cadence rules.
     * Requirement 7 (Connector freshness and SLA tracking)
     */
    static async checkFreshness(connectorId: string, category: IntegrationCategory, lastSyncAt: Date | null) {
        if (!lastSyncAt) return 'STALE';
        
        const now = new Date().getTime();
        const last = new Date(lastSyncAt).getTime();
        const diffMin = (now - last) / (1000 * 60);

        const thresholds: Record<IntegrationCategory, number> = {
            'ERP': 1440, // 24 hours
            'CRM': 60,   // 1 hour
            'OMS': 15,   // 15 minutes
            'PAYMENT_GATEWAY': 5,
            'SHIPPING_GATEWAY': 30,
            'ANALYTICS': 1440,
            'MARKETPLACE': 60,
            'MARKETING': 1440,
            'CUSTOM_API': 15,
            'FILE_BASED': 1440,
            'WEBHOOK_SOURCE': 5
        };

        const limit = thresholds[category] || 60;
        return diffMin > limit ? 'STALE' : 'HEALTHY';
    }
}
