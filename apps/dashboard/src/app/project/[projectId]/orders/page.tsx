'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { 
  PageLayout, 
  Typography, 
  Card, 
  Badge, 
  BadgeVariant,
  FilterBar, 
  InformationState,
  DiagnosticDrawer,
  OperationalTable,
  Column,
  MetricCard
} from '@kpi-platform/ui';
import { 
  Package, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  ShoppingBag, 
  ArrowRight,
  Activity,
  Filter,
  Search,
  MoreHorizontal,
  ChevronRight,
  RefreshCw,
  Box,
  Truck,
  CreditCard,
  Building2,
  FileText
} from 'lucide-react';

// Orders specific components
import { OrderHealthSummary } from '../../../../components/orders/OrderHealthSummary';
import { LifecycleDistribution } from '../../../../components/orders/LifecycleDistribution';
import { OrderDetailDrawerContent } from '../../../../components/orders/OrderDetailDrawerContent';

export default function OrdersPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    
    // State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        totalOrders: 0, ordersThisHour: 0, onlineSplit: 0, offlineSplit: 0, delayedCount: 0, failedCount: 0, ordersPerMinute: '0.00'
    });
    const [orders, setOrders] = useState<any[]>([]);
    
    // UI State
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            const [s, oList] = await Promise.all([
                apiFetch(`/api/v1/dashboard/orders/summary?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/orders/list?siteId=${projectId}`)
            ]);
            setStats(s);
            setOrders(oList);
        } catch (e) {
            console.error('Failed to sync order intelligence:', e);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s refresh for orders
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleInspect = (order: any) => {
        setSelectedOrder(order);
        setIsDrawerOpen(true);
    };

    const handleAction = async (action: string) => {
        // Implementation for retry/reprocess actions
        console.log(`Action triggered for ${selectedOrder?.id}: ${action}`);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  o.externalOrderId.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !filterStatus || o.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, filterStatus]);

    const getStatusVariant = (status: string): BadgeVariant => {
        switch (status.toLowerCase()) {
            case 'shipped':
            case 'delivered':
            case 'paid': return 'success';
            case 'placed':
            case 'processing': return 'processing';
            case 'cancelled':
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const orderColumns: Column<any>[] = [
        { 
            key: 'id', 
            header: 'Order Reference', 
            render: (val, row) => (
                <div>
                   <Typography variant="body" weight="bold" className="text-sm" noMargin>{val}</Typography>
                   <Typography variant="micro" className="text-text-muted">{row.externalOrderId}</Typography>
                </div>
            )
        },
        { 
            key: 'orderSource', 
            header: 'Channel',
            render: (val) => (
                <div className="flex items-center gap-2">
                    {val === 'online' ? <Activity size={14} className="text-primary"/> : <Building2 size={14} className="text-text-muted"/>}
                    <span className="text-xs uppercase font-bold text-text-secondary">{val}</span>
                </div>
            )
        },
        { 
            key: 'status', 
            header: 'Lifecycle State',
            render: (val) => (
                <Badge variant={getStatusVariant(val)} size="sm">
                    {val.toUpperCase()}
                </Badge>
            )
        },
        { 
            key: 'health', 
            header: 'Health',
            render: (val) => (
                <Badge variant={val === 'healthy' ? 'success' : val === 'delayed' ? 'warning' : 'error'} size="sm" dot>
                    {val?.toUpperCase()}
                </Badge>
            )
        },
        { 
            key: 'syncStatus', 
            header: 'Reconciliation',
            render: (val) => (
                <Badge variant={val === 'synced' ? 'default' : 'error'} size="sm" className={val !== 'synced' ? 'animate-pulse' : ''}>
                    {val?.toUpperCase()}
                </Badge>
            )
        },
        { 
            key: 'amount', 
            header: 'Value',
            align: 'right',
            render: (val) => <span className="font-bold">${val.toFixed(2)}</span>
        },
        { 
            key: 'createdAt', 
            header: 'Age',
            align: 'right',
            render: (val) => {
                const diff = (Date.now() - new Date(val).getTime()) / 60000;
                return <span className={diff > 60 ? 'text-error font-bold' : 'text-text-muted'}>{Math.floor(diff)}m ago</span>;
            }
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: () => <ChevronRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
        }
    ];

    return (
        <PageLayout
            title="Order Operations Console"
            subtitle="Real-time oversight and intelligence for high-volume order flows."
            icon={<Package size={24} />}
        >
            <div className="space-y-6">
                {/* 1. Statistics & Velocity Header */}
                <OrderHealthSummary stats={stats} loading={loading} />

                {/* 2. Exception Highlighting */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="bg-error-bg border-error/10 p-5 flex items-center justify-between group cursor-pointer hover:border-error/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <Typography variant="h2" weight="bold" noMargin className="text-error-text">{stats.failedCount}</Typography>
                                <Typography variant="caption" className="text-error-text opacity-70">Critical Order Failures</Typography>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-error opacity-40 group-hover:opacity-100 transform group-hover:translateX-1 transition-all" />
                    </Card>

                    <Card className="bg-warning-bg border-warning/10 p-5 flex items-center justify-between group cursor-pointer hover:border-warning/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
                                <Clock size={24} />
                            </div>
                            <div>
                                <Typography variant="h2" weight="bold" noMargin className="text-warning-text">{stats.delayedCount}</Typography>
                                <Typography variant="caption" className="text-warning-text opacity-70">SLA Breach / Delays</Typography>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-warning opacity-40 group-hover:opacity-100 transform group-hover:translateX-1 transition-all" />
                    </Card>

                    <Card className="border-subtle p-5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-text-muted group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                <FileText size={24} />
                            </div>
                            <div>
                                <Typography variant="h2" weight="bold" noMargin>{stats.mismatches || 0}</Typography>
                                <Typography variant="caption" className="text-text-muted">Unreconciled Mismatches</Typography>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-text-muted opacity-40 group-hover:opacity-100 transform group-hover:translateX-1 transition-all" />
                    </Card>
                </div>

                {/* 3. Lifecycle & Distribution */}
                <LifecycleDistribution 
                    loading={loading}
                    stages={stats.stages || []}
                />

                {/* 4. Unified Filter Bar */}
                <FilterBar 
                    searchPlaceholder="Search Order ID, Marketplace ID, or Customer..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={[
                        {
                            id: 'status',
                            label: 'Status',
                            value: filterStatus,
                            options: [
                                { label: 'Placed', value: 'placed' },
                                { label: 'Shipped', value: 'shipped' },
                                { label: 'Paid', value: 'paid' },
                                { label: 'Cancelled', value: 'cancelled' },
                                { label: 'Failed', value: 'failed' }
                            ]
                        }
                    ]}
                    onFilterChange={(_, val) => setFilterStatus(val)}
                    activeFilterCount={filterStatus ? 1 : 0}
                    onClearFilters={() => { setFilterStatus(''); setSearchQuery(''); }}
                />

                {/* 5. High-Performance Orders Table */}
                <Card className="p-0 overflow-hidden border-subtle border">
                    <OperationalTable 
                        columns={orderColumns} 
                        data={filteredOrders} 
                        isLoading={loading}
                        isEmpty={filteredOrders.length === 0}
                        onRowClick={handleInspect}
                        className="group"
                    />
                </Card>
            </div>

            {/* Order Diagnostic Side Panel */}
            <DiagnosticDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Order Details"
                subtitle={`Site: ${projectId} • Integrity: ${selectedOrder?.health === 'healthy' ? 'Verified' : 'Review Required'}`}
                width="600px"
            >
                <OrderDetailDrawerContent 
                    order={selectedOrder}
                    timeline={useMemo(() => {
                        if (!selectedOrder) return [];
                        const events = [
                            { title: 'Order Placed', time: 'Captured', system: selectedOrder.channel?.toUpperCase() || 'SOURCE', type: 'success' },
                        ];
                        if (['paid', 'shipped', 'delivered'].includes(selectedOrder.status)) {
                            events.push({ title: 'Payment Validated', time: 'Processed', system: 'GATEWAY', type: 'success' });
                        }
                        if (selectedOrder.syncStatus === 'error') {
                            events.push({ title: 'Sync Failure', time: 'Recent', system: 'OMS-1', type: 'error', description: 'Internal processing error during synchronization.' });
                        } else if (selectedOrder.syncStatus === 'synced') {
                            events.push({ title: 'Unified State Sync', time: 'Success', system: 'CORE', type: 'success' });
                        }
                        return events.reverse();
                    }, [selectedOrder])}
                    reconciliation={useMemo(() => {
                        if (!selectedOrder) return [];
                        return [
                            { name: 'Storefront State', id: 'SOURCE_API', value: `$${selectedOrder.amount?.toFixed(2)}`, match: true, icon: <ShoppingBag size={14}/> },
                            { name: 'OMS State', id: 'INTEGRATION_LAYER', value: `$${selectedOrder.amount?.toFixed(2)}`, match: selectedOrder.syncStatus !== 'mismatch', icon: <Building2 size={14}/> },
                            { name: 'Financial Ledger', id: 'ERP_CORE', value: `$${selectedOrder.amount?.toFixed(2)}`, match: true, icon: <RefreshCw size={14}/> },
                        ];
                    }, [selectedOrder])}
                    onAction={handleAction}
                />
            </DiagnosticDrawer>
        </PageLayout>
    );
}
