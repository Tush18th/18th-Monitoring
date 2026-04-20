import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { customerProfiles, customerEvents, customerSessions } from '../../../../packages/db/src/drizzle/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';

export class CustomerAnalyticsService {
    
    /**
     * Requirement 11: Cohort Modeling
     * Fetches customers acquired within a specific date range (First Seen).
     */
    static async getAcquisitionCohort(siteId: string, startDate: Date, endDate: Date) {
        return db.select().from(customerProfiles).where(and(
            eq(customerProfiles.siteId, siteId),
            gte(customerProfiles.firstSeenAt, startDate),
            sql`${customerProfiles.firstSeenAt} <= ${endDate}`
        ));
    }

    /**
     * Requirement 12: Attribution Analysis
     * Calculates the most effective traffic sources based on conversion (Sessions with isConverted=1).
     */
    static async getTrafficSourcePerformance(siteId: string) {
        return db.select({
            source: customerSessions.trafficSource,
            totalSessions: sql<number>`count(*)`,
            conversions: sql<number>`sum(is_converted)`,
            conversionRate: sql<number>`sum(is_converted)::float / count(*)`
        })
        .from(customerSessions)
        .where(eq(customerSessions.siteId, siteId))
        .groupBy(customerSessions.trafficSource)
        .orderBy(desc(sql`conversions`));
    }

    /**
     * Requirement 10: Segmentation Engine
     * Example: segmenting 'High Value' customers (e.g. repeat purchasers).
     */
    static async getHighValueSegments(siteId: string) {
        return db.select().from(customerProfiles).where(and(
            eq(customerProfiles.siteId, siteId),
            eq(customerProfiles.lifecycleState, 'REPEAT_PURCHASER')
        ));
    }
}
