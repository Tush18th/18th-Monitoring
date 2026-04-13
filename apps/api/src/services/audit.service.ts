/**
 * Audit Logging Service
 * 
 * Centralized structured logging for security-sensitive operations.
 * 
 * PRODUCTION NOTE: This should write to an append-only datastore or 
 * external log aggregator (e.g., Splunk, Elasticsearch, Datadog)
 * and definitely NOT just stdout.
 */
export class AuditService {
    static async log(event: {
        action: string;
        actorId: string;
        actorRole?: string;
        targetId?: string;
        resource?: string;
        status: 'SUCCESS' | 'FAILURE';
        metadata?: Record<string, any>;
    }) {
        const entry = {
            ...event,
            timestamp: new Date().toISOString(),
            service: 'kpi-monitoring-api',
            type: 'AUDIT'
        };

        // In a real system, publish to SEC_EVENTS topic or write to DB
        console.log(`[AUDIT] ${JSON.stringify(entry)}`);
    }
}
