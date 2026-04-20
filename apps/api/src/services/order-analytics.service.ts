import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { canonicalOrders } from '../../../../packages/db/src/drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export class OrderAnalyticsService {
    
    /**
     * Requirement 15: Trusted Order Aggregates
     * Computes aggregates only from orders that have passed validation (VALID quality state).
     */
    static async getDailyRevenue(siteId: string, days = 30) {
        // Ensuring only high-confidence data is used for KPIs (Requirement 15)
        return db.select({
            date: sql<string>`DATE(created_at)`,
            totalRevenue: sql<number>`SUM(grand_total)`,
            orderCount: sql<number>`COUNT(*)`,
            avgOrderValue: sql<number>`AVG(grand_total)`
        })
        .from(canonicalOrders)
        .where(and(
            eq(canonicalOrders.siteId, siteId),
            eq(canonicalOrders.qualityState, 'VALID') // Trust Layer filter
        ))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(desc(sql`DATE(created_at)`));
    }

    /**
     * Requirement 15: Segmented Aggregation (Channel & Lifecycle)
     */
    static async getChannelPerformance(siteId: string) {
        return db.select({
            channel: canonicalOrders.channel,
            orderCount: sql<number>`COUNT(*)`,
            totalValue: sql<number>`SUM(grand_total)`
        })
        .from(canonicalOrders)
        .where(and(
            eq(canonicalOrders.siteId, siteId),
            eq(canonicalOrders.qualityState, 'VALID')
        ))
        .groupBy(canonicalOrders.channel);
    }
}
