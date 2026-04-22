import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import crypto from 'crypto';

/**
 * AuditService
 *
 * Centralized immutable audit trail for governance and compliance.
 */
export class AuditService {

    /**
     * Unified audit log method — accepts the flexible event signature
     * used across auth, governance, middleware, and public routes.
     */
    public static async log(params: {
        action: string;
        tenantId?: string;
        siteId?: string;
        actorId?: string;
        actorRole?: string;
        targetId?: string;
        entityType?: string;
        entityId?: string;
        status?: string;
        metadata?: any;
        meta?: any;
    }): Promise<void> {
        const auditEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...params
        };

        if (!GlobalMemoryStore.governanceAuditLogs) {
            (GlobalMemoryStore as any).governanceAuditLogs = [];
        }
        GlobalMemoryStore.governanceAuditLogs.push(auditEntry);

        const statusTag = params.status ? `[${params.status}]` : '';
        console.log(`[AUDIT] ${statusTag} ${params.action} | tenant=${params.tenantId || 'platform'} | site=${params.siteId || params.targetId || 'global'} | actor=${params.actorId || 'system'}`);
    }

    /**
     * Records an administrative action (legacy alias — prefer log()).
     */
    public static async logAction(params: {
        siteId: string;
        userId: string;
        action: string;
        resource: string;
        details?: any;
    }) {
        return AuditService.log({
            action: params.action,
            actorId: params.userId,
            siteId: params.siteId,
            entityType: 'resource',
            entityId: params.resource,
            metadata: params.details,
            status: 'SUCCESS'
        });
    }

    /**
     * Retrieves audit trail for a project.
     */
    public static async getTrail(siteId: string) {
        return (GlobalMemoryStore.governanceAuditLogs || []).filter((l: any) => l.siteId === siteId);
    }
}
