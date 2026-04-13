import { KpiEngine } from '../engine/kpi-engine';
import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import { orderNormalizationService } from '../../../../apps/api/src/services/order-normalization.service';

export class OrderHandler {
    static async handle(event: any) {
        const { siteId, eventType, metadata } = event.value;
        const orderId = metadata?.orderId;
        if (!orderId) return;

        if (eventType === 'order_placed') {
            const canonicalOrder = await orderNormalizationService.normalize(event.value, siteId);
            GlobalMemoryStore.orders.set(orderId, {
                status: canonicalOrder.status,
                placedAt: canonicalOrder.createdAt,
                siteId,
                channel: canonicalOrder.channel,
                source: canonicalOrder.orderSource
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
