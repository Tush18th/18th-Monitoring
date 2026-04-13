import { IngestionService } from '../apps/api/src/services/ingestion.service';
import { KafkaStreamConsumer } from '../services/processor/src/consumer/kafka-consumer';
import { DashboardService } from '../apps/api/src/services/dashboard.service';
import * as crypto from 'crypto';

async function generateEvent(type: string, metadata: any) {
    return {
        eventId: crypto.randomUUID(),
        siteId: 'store_001',
        eventType: type,
        timestamp: new Date().toISOString(),
        metadata
    };
}

async function run() {
    console.log('--- STARTING SYSTEM E2E SIMULATION ---\n');

    // 1. Boot Subscriptions natively hooking memory maps 
    const consumer = new KafkaStreamConsumer();
    await consumer.connectAndSubscribe(['browser-events-stream-v1', 'server-events-stream-v1']);
    console.log('\n');

    // 2. Scenario mapping Page Load > Limits constraints 
    console.log('>>> SCENARIO 1: Tracking Performance Degradation (Page Load)');
    await IngestionService.processBrowserEvents('store_001', [
        await generateEvent('page_view', { loadTime: 4500, url: '/' }) // Should natively push limits over 3000ms bounds 
    ]);
    
    // 3. Scenario mapping Error Limits tracking 
    console.log('\n>>> SCENARIO 2: JS Error Trace Hooking');
    await IngestionService.processBrowserEvents('store_001', [
        await generateEvent('js_error', { errorMsg: 'Cannot read properties of undefined' }),
        await generateEvent('js_error', { errorMsg: 'Network Timeout Limit' }),
        await generateEvent('js_error', { errorMsg: 'React Minified Component mapping drop' }) // Triples bounds implicitly scaling metrics tracking
    ]);

    // 4. Scenario mapping Integration Spikes 
    console.log('\n>>> SCENARIO 3: Detecting External Integration Failures (OMS Spiking)');
    await IngestionService.processServerEvents('store_001', [
        await generateEvent('oms_sync_failed', { error: '503 Gateway Time-out constraints' }),
        await generateEvent('oms_sync_failed', { error: '503 Gateway Time-out constraints' }) // Push explicit failure increment bindings 
    ]);

    // 5. Query Dashboard bounds wrapping logic locally securely 
    console.log('\n>>> DASHBOARD EXTRACTION TIER');
    const summaries = await DashboardService.getKpiSummaries({ siteId: 'store_001', timeRange: '24h' });
    const alerts = await DashboardService.getActiveAlerts({ siteId: 'store_001', timeRange: '24h' });

    console.log('\n--- Accessible Dashboard Metrics Profiles ---');
    console.table(summaries);

    console.log('\n--- Escalated Active Dashboard Alerts ---');
    console.table(alerts.map((a:any) => ({ id: a.alertId, rule: a.ruleId, message: a.message })));

    console.log('\n--- SUCCESSFUL COMPLETION OF E2E PIPELINE RUN ---');
}

run().catch(console.error);
