import crypto from 'crypto';
import { TimeSeriesRepository, EventStoreRepository, RelationalRepository } from '../interfaces';
import { MetricRecord, Tenant, SiteMetadata } from '../models';
import { ConfigResolver } from '../../../../packages/config/src/resolver';

// ─── Singleton in-memory store shared across the whole process ────────────────
export const GlobalMemoryStore = {
    metrics:  [] as MetricRecord[],
    events:   [] as any[],
    alerts:   [] as any[],
    orders:   new Map<string, { status: string, placedAt: string, siteId: string, channel: string }>(),
    users:    new Map<string, any>(),
    projects: new Map<string, any>(),
    sessions: new Map<string, any>(),

    _p(pwd: string): string {
        const salt = process.env.JWT_SECRET || 'hardcoded_demo_salt';
        const hash = crypto.scryptSync(pwd, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    },

    seed() {
        const now = new Date().toISOString();
        // Seed Projects
        this.projects.set('store_001', { 
            id: 'store_001', name: 'Standard Store v1', status: 'active',
            description: 'Main US retail frontend with default monitoring',
            lastActivity: now,
            metricsSummary: { activeUsers: 1420, errorRate: 1.2, revenue: 12500 }
        });
        this.projects.set('store_002', { 
            id: 'store_002', name: 'Premium Merchant',   status: 'active',
            description: 'High-volume checkout with critical alerts enabled',
            lastActivity: now,
            metricsSummary: { activeUsers: 840, errorRate: 0.5, revenue: 42000 }
        });
        this.projects.set('store_003', { 
            id: 'store_003', name: 'Store EU-01',   status: 'maintenance',
            description: 'European cluster currently undergoing load test',
            lastActivity: now,
            metricsSummary: { activeUsers: 12, errorRate: 94.0, revenue: 0 }
        });

        // Seed Users
        this.users.set('superadmin@monitor.io', {
            id: 'u1', email: 'superadmin@monitor.io', name: 'Super Admin', 
            passwordHash: this._p('password123'),
            role: 'SUPER_ADMIN', status: 'active', assignedProjects: ['store_001', 'store_002', 'store_003'],
            audit: { createdAt: now, updatedAt: now }
        });
        
        this.users.set('admin@store001.com', {
            id: 'u2', email: 'admin@store001.com', name: 'Project Admin', 
            passwordHash: this._p('password123'),
            role: 'ADMIN', status: 'active', assignedProjects: ['store_001'],
            audit: { createdAt: now, updatedAt: now }
        });

        this.users.set('viewer@store001.com', {
            id: 'u3', email: 'viewer@store001.com', name: 'Customer Viewer', 
            passwordHash: this._p('password123'),
            role: 'CUSTOMER', status: 'active', assignedProjects: ['store_001'],
            audit: { createdAt: now, updatedAt: now }
        });

        console.log('[DB] Seeded 3 users with dynamically hashed passwords');
    }
};

// Initial seed
GlobalMemoryStore.seed();

// ─── Time-Series Adapter ──────────────────────────────────────────────────────
export class InMemoryTimeSeriesAdapter implements TimeSeriesRepository {
    async insertBatch(metrics: MetricRecord[]): Promise<void> {
        GlobalMemoryStore.metrics.push(...metrics);
        console.log(`[Storage:TS] Saved ${metrics.length} metric records.`);
    }

    async queryKpi(siteId: string, kpiName: string, _startTime?: string, _endTime?: string): Promise<MetricRecord[]> {
        return GlobalMemoryStore.metrics.filter(m => m.siteId === siteId && m.kpiName === kpiName);
    }
}

// ─── Event Store Adapter ──────────────────────────────────────────────────────
export class InMemoryEventAdapter implements EventStoreRepository {
    async appendEvent(_eventId: string, _siteId: string, payload: any): Promise<void> {
        GlobalMemoryStore.events.push(payload);
    }
    async getEvent(_eventId: string): Promise<any | null> { return null; }
    async queryEvents(_siteId: string, _filters: any): Promise<any[]> { return GlobalMemoryStore.events; }
}

// ─── Relational Adapter ───────────────────────────────────────────────────────
export class InMemoryRelationalAdapter implements RelationalRepository {
    async getTenant(_tenantId: string): Promise<Tenant | null> { return null; }
    async getSiteMetadata(_siteId: string): Promise<SiteMetadata | null> { return null; }
    async updateSiteConfig(_siteId: string, _config: any): Promise<void> {}

    async getAlertRules(siteId: string): Promise<any[]> {
        const resolver = new ConfigResolver();
        const config = resolver.resolve(siteId);
        
        // Dynamically build rules based on thresholds config
        return [
            { id: 'rule_page_load_01',    siteId, kpiName: 'pageLoadTime',         threshold: config.thresholds.pageLoadMs, type: 'gt', severity: 'warning'  },
            { id: 'rule_error_rate_01',   siteId, kpiName: 'errorRatePct',          threshold: config.thresholds.errorRatePct,    type: 'gt', severity: 'high'     },
            { id: 'rule_oms_failure_01',  siteId, kpiName: 'oms_sync_failed_count', threshold: 0,    type: 'gt', severity: 'critical' },
            { id: 'rule_delayed_orders_01', siteId, kpiName: 'delayedOrdersCount',  threshold: 0,    type: 'gt', severity: 'warning' },
        ];
    }

    async saveAlertState(alert: any): Promise<void> {
        // De-duplicate: one active alert per rule
        const existing = GlobalMemoryStore.alerts.find(
            a => a.ruleId === alert.ruleId && a.status === 'active'
        );
        if (!existing) {
            alert.status  = 'active';
            alert.alertId = 'alt_' + Math.random().toString(36).slice(2, 7).toUpperCase();
            GlobalMemoryStore.alerts.push(alert);
            console.log(`[Storage:Alert] 🔴 New alert: ${alert.kpiName} → "${alert.message}"`);
        }
    }

    // ─── User Management ───
    async getUsersByProject(projectId: string): Promise<any[]> {
        return Array.from(GlobalMemoryStore.users.values()).filter(u => 
            u.assignedProjects.includes(projectId) && u.role === 'CUSTOMER'
        );
    }

    async createUser(user: any): Promise<void> {
        if (GlobalMemoryStore.users.has(user.email)) {
            throw new Error('User already exists');
        }
        GlobalMemoryStore.users.set(user.email, user);
    }

    async updateUser(userId: string, updates: any): Promise<void> {
        // userId is email in this in-memory mock
        const user = GlobalMemoryStore.users.get(userId);
        if (!user) throw new Error('User not found');
        
        Object.assign(user, updates);
        user.audit.updatedAt = new Date().toISOString();
    }
}
