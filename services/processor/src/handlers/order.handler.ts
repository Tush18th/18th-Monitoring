import { KpiEngine } from '../engine/kpi-engine';
import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';

export class OrderHandler {
    static async handle(event: any) {
        const { siteId, eventType, metadata } = event.value;
        const orderId = metadata?.orderId;
        if (!orderId) return;

        if (eventType === 'order_placed') {
            GlobalMemoryStore.orders.set(orderId, {
                status: 'placed',
                placedAt: new Date().toISOString(),
                siteId,
                channel: metadata.channel || 'web'
            });
            await KpiEngine.recordOrder(siteId, orderId, true);
        } else if (eventType === 'order_processed') {
            const order = GlobalMemoryStore.orders.get(orderId);
            if (order) {
                order.status = 'processed';
                // Success metric
                await KpiEngine.recordOrderLifecycle(siteId, orderId, 'processed');
            }
        }
    }
}
