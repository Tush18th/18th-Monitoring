import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { performanceMetrics, performanceRollups } from '../../../../packages/db/src/drizzle/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { 
    PerformanceSignal, 
    PerformanceRollup, 
    PerformanceMetricName 
} from '../../../../packages/shared-types/src';
import crypto from 'crypto';

export class PerformanceIntelligenceService {
    
    /**
     * Ingests a new performance signal accurately.
     * Requirement 1 & 9
     */
    static async ingestSignal(signal: Omit<PerformanceSignal, 'id'>) {
        const id = crypto.randomUUID();
        
        // 1. STORE RAW SIGNAL (Requirement 3)
        await db.insert(performanceMetrics).values({
            ...signal,
            metricValue: signal.value.toString(),
            timestamp: new Date(signal.timestamp),
            region: signal.dimensions.region,
            device: signal.dimensions.device,
            browser: signal.dimensions.browser,
            route: signal.dimensions.route,
            releaseVersion: signal.dimensions.release
        });

        // 2. REAL-TIME ANOMALY CHECK (Requirement 11)
        await this.checkAnomalies(signal);

        return id;
    }

    /**
     * Computes high-resolution rollups including percentiles.
     * Requirement 4 & 5
     */
    static async computeRollup(siteId: string, metricName: PerformanceMetricName, bucket: '1m' | '5m' | '1h', from: Date, to: Date) {
        // Fetch raw data for the window
        const signals = await db.select().from(performanceMetrics).where(and(
            eq(performanceMetrics.siteId, siteId),
            eq(performanceMetrics.metricName, metricName),
            gte(performanceMetrics.timestamp, from),
            lte(performanceMetrics.timestamp, to)
        ));

        if (signals.length === 0) return null;

        const values = signals.map(s => parseFloat(s.metricValue as string)).sort((a, b) => a - b);
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);

        // PERCENTILE COMPUTATION (Requirement 5)
        const getP = (p: number) => values[Math.floor((p / 100) * (count - 1))];

        const rollup: PerformanceRollup = {
            siteId,
            metricName,
            bucketSize: bucket,
            timestamp: from.toISOString(),
            count,
            min: values[0],
            max: values[count - 1],
            avg: sum / count,
            p50: getP(50),
            p75: getP(75),
            p90: getP(90),
            p95: getP(95),
            p99: getP(99),
            dimensions: {} // In production, we'd group by dimensions too
        };

        // 3. STORE ROLLUP (Requirement 4)
        await db.insert(performanceRollups).values({
            ...rollup,
            min: rollup.min.toString(),
            max: rollup.max.toString(),
            p50: rollup.p50.toString(),
            p75: rollup.p75.toString(),
            p90: rollup.p90.toString(),
            p95: rollup.p95.toString(),
            p99: rollup.p99.toString(),
            timestamp: new Date(rollup.timestamp)
        });

        return rollup;
    }

    /**
     * Requirement 11: Anomaly Detection Framework
     */
    private static async checkAnomalies(signal: Omit<PerformanceSignal, 'id'>) {
        // Example: Static threshold for TTFB
        if (signal.name === 'TTFB' && signal.value > 2000) {
            console.warn(`[PerformanceIntelligence] Anomaly detected: HIGH TTFB for ${signal.siteId} (${signal.value}ms)`);
            // Trigger health metric or alert
        }
    }
}
