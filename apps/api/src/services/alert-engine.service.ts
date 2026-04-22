import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { env } from '../config/env';
import crypto from 'crypto';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';

export interface AlertRule {
    id: string;
    siteId: string;
    tenantId: string;
    ruleType: 'KPI_THRESHOLD' | 'KPI_DELTA' | 'FRESHNESS' | 'PIPELINE_FAILURE' | 'CONNECTOR_HEALTH';
    label: string;
    metricRef: string;       // KPI key or metric name
    condition: 'GT' | 'LT' | 'EQ' | 'DELTA_GT';
    thresholdValue: number;
    severity: AlertSeverity;
    cooldownMinutes: number;
    enabled: boolean;
}

export interface AlertRecord {
    id: string;
    ruleId: string;
    tenantId: string;
    siteId: string;
    severity: AlertSeverity;
    status: AlertStatus;
    message: string;
    metricRef: string;
    currentValue: number;
    thresholdValue: number;
    triggeredAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    correlationId: string;
}

export class AlertEngine {

    /**
     * Entry point: evaluate all active rules for a project.
     * Called after KPI updates, pipeline failures, and health checks.
     */
    public static async evaluateProject(siteId: string, tenantId: string) {
        const rules = this.getRulesForProject(siteId);

        for (const rule of rules.filter(r => r.enabled)) {
            try {
                await this.evaluateRule(rule);
            } catch(err: any) {
                console.error(`[AlertEngine] Failed to evaluate rule ${rule.id}:`, err.message);
            }
        }
    }

    /**
     * Evaluate a single rule against current metric state.
     */
    private static async evaluateRule(rule: AlertRule) {
        const currentValue = this.resolveCurrentValue(rule);
        if (currentValue === null) return;

        const conditionMet = this.checkCondition(currentValue, rule.condition, rule.thresholdValue);

        if (conditionMet) {
            // Deduplication: suppress if active alert already exists within cooldown
            const isDuplicate = this.isAlertActive(rule);
            if (isDuplicate) return;

            const alert = await this.generateAlert(rule, currentValue);
            await NotificationDispatcher.dispatch(alert);
            console.log(`[AlertEngine] 🚨 Alert triggered: [${rule.severity.toUpperCase()}] ${alert.message}`);
        } else {
            // Auto-resolve any active alerts for this rule if condition is no longer met
            this.autoResolve(rule);
        }
    }

    private static resolveCurrentValue(rule: AlertRule): number | null {
        switch (rule.ruleType) {
            case 'KPI_THRESHOLD':
            case 'KPI_DELTA': {
                const metrics = GlobalMemoryStore.metrics.filter(
                    (m: any) => m.siteId === rule.siteId && m.kpiName === rule.metricRef
                );
                if (metrics.length === 0) return null;
                return metrics.reduce((sum: number, m: any) => sum + (m.value || 0), 0);
            }
            case 'PIPELINE_FAILURE': {
                const dlqCount = GlobalMemoryStore.deadLetterQueue.filter(
                    (d: any) => d.siteId === rule.siteId && !d.actionTaken
                ).length;
                return dlqCount;
            }
            case 'FRESHNESS': {
                const syncHistory = GlobalMemoryStore.syncHistory.filter((e: any) => e.projectId === rule.siteId);
                const latest = syncHistory.sort((a: any, b: any) =>
                    new Date(b.receivedAt ?? b.createdAt).getTime() - new Date(a.receivedAt ?? a.createdAt).getTime()
                )[0];
                if (!latest) {
                    // Prevent noisy freshness alerts on uninitialized demo/local projects
                    return env.NODE_ENV === 'development' ? null : 9999.00;
                }
                return (Date.now() - new Date(latest.receivedAt ?? latest.createdAt).getTime()) / 60000;
            }
            case 'CONNECTOR_HEALTH': {
                const integrations = GlobalMemoryStore.projectIntegrations.get(rule.siteId) || [];
                return integrations.filter((i: any) => i.healthStatus === 'DEGRADED').length;
            }
            default:
                return null;
        }
    }

    private static checkCondition(value: number, condition: string, threshold: number): boolean {
        switch (condition) {
            case 'GT': return value > threshold;
            case 'LT': return value < threshold;
            case 'EQ': return value === threshold;
            case 'DELTA_GT': return Math.abs(value) > threshold;
            default: return false;
        }
    }

    private static isAlertActive(rule: AlertRule): boolean {
        const existingActive = GlobalMemoryStore.alerts.find(
            (a: any) => a.ruleId === rule.id && a.status === 'active'
        );

        if (!existingActive) return false;

        // Check cooldown window
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        const elapsed = Date.now() - new Date(existingActive.triggeredAt).getTime();
        return elapsed < cooldownMs;
    }

    private static async generateAlert(rule: AlertRule, currentValue: number): Promise<AlertRecord> {
        const alert: AlertRecord = {
            id: crypto.randomUUID(),
            ruleId: rule.id,
            tenantId: rule.tenantId,
            siteId: rule.siteId,
            severity: rule.severity,
            status: 'active',
            message: `[${rule.label}] Value ${currentValue.toFixed(2)} breached threshold ${rule.thresholdValue}`,
            metricRef: rule.metricRef,
            currentValue,
            thresholdValue: rule.thresholdValue,
            triggeredAt: new Date().toISOString(),
            correlationId: crypto.randomUUID()
        };

        GlobalMemoryStore.alerts.push(alert);
        return alert;
    }

    private static autoResolve(rule: AlertRule) {
        const activeAlerts = GlobalMemoryStore.alerts.filter(
            (a: any) => a.ruleId === rule.id && a.status === 'active'
        );
        for (const alert of activeAlerts) {
            alert.status = 'resolved';
            alert.resolvedAt = new Date().toISOString();
            console.log(`[AlertEngine] ✅ Auto-resolved alert for rule ${rule.label}`);
        }
    }

    public static acknowledge(alertId: string, userId: string) {
        const alert = GlobalMemoryStore.alerts.find((a: any) => a.id === alertId);
        if (!alert || alert.status !== 'active') return;
        alert.status = 'acknowledged';
        alert.acknowledgedAt = new Date().toISOString();
        alert.acknowledgedBy = userId;
    }

    public static resolve(alertId: string, userId: string) {
        const alert = GlobalMemoryStore.alerts.find((a: any) => a.id === alertId);
        if (!alert) return;
        alert.status = 'resolved';
        alert.resolvedAt = new Date().toISOString();
        alert.resolvedBy = userId;
    }

    private static getRulesForProject(siteId: string): AlertRule[] {
        // Bootstrap default rules if this project has none
        const existing = (GlobalMemoryStore.alertRules || []).filter((r: any) => r.siteId === siteId);
        if (existing.length > 0) return existing;

        // Seed reference rules
        const project = GlobalMemoryStore.projects.get(siteId);
        if (!project) return [];

        const defaults: AlertRule[] = [
            {
                id: `rule_${siteId}_freshness`,
                siteId,
                tenantId: project.tenantId,
                ruleType: 'FRESHNESS',
                label: 'Data Freshness SLA',
                metricRef: 'ingestion_lag_minutes',
                condition: 'GT',
                thresholdValue: 30,
                severity: 'warning',
                cooldownMinutes: 15,
                enabled: true
            },
            {
                id: `rule_${siteId}_pipeline_dlq`,
                siteId,
                tenantId: project.tenantId,
                ruleType: 'PIPELINE_FAILURE',
                label: 'Dead Letter Queue Overflow',
                metricRef: 'dlq_count',
                condition: 'GT',
                thresholdValue: 5,
                severity: 'critical',
                cooldownMinutes: 5,
                enabled: true
            },
            {
                id: `rule_${siteId}_connector_degraded`,
                siteId,
                tenantId: project.tenantId,
                ruleType: 'CONNECTOR_HEALTH',
                label: 'Degraded Connectors',
                metricRef: 'degraded_connector_count',
                condition: 'GT',
                thresholdValue: 0,
                severity: 'warning',
                cooldownMinutes: 10,
                enabled: true
            }
        ];

        GlobalMemoryStore.alertRules = [...(GlobalMemoryStore.alertRules || []), ...defaults];
        return defaults;
    }
}
