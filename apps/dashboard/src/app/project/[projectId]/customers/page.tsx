'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Activity,
  Layers,
  Filter,
  Search,
  ChevronRight,
  Mail,
  Calendar,
  Shield,
  MapPin,
  Smartphone,
  Globe,
  Clock,
  History,
  Table as TableIcon
} from 'lucide-react';
import {
  PageLayout,
  Typography,
  Card,
  Badge,
  Button,
  OperationalTable,
  DiagnosticDrawer,
  Column
} from '@kpi-platform/ui';
import { useAuth } from '../../../../context/AuthContext';

import { CustomerDiscoveryHeader } from '../../../../components/customers/CustomerDiscoveryHeader';
import { BehavioralFunnel } from '../../../../components/customers/BehavioralFunnel';
import { SegmentIntelligence } from '../../../../components/customers/SegmentIntelligence';

export default function CustomersPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { token, apiFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    identifiedRatio: 0,
    newVsReturning: 0,
    sessions: 0
  });
  const [intelligence, setIntelligence] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;

    setLoading(true);
    try {
      const [summ, intel] = await Promise.all([
        apiFetch(`/api/v1/dashboard/customers/summary?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/customers/intelligence?siteId=${projectId}`)
      ]);
      setSummary(summ);
      setIntelligence(intel);
    } catch (err) {
      console.error('Customer intelligence failure:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, token, apiFetch]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const identityColumns: Column<any>[] = [
    {
      key: 'identity',
      header: 'Customer Identity',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <Typography variant="body" weight="bold" className="text-sm">
              {row.name}
            </Typography>
            <Typography variant="micro" className="text-text-muted">
              {row.email}
            </Typography>
          </div>
        </div>
      )
    },
    {
      key: 'state',
      header: 'Lifecycle State',
      render: (val) => (
        <Badge variant={val === 'VIP' ? 'success' : 'info'} size="sm" dot>
          {val}
        </Badge>
      )
    },
    { key: 'sessions', header: 'Sessions', align: 'right' },
    { key: 'lastActive', header: 'Last Active', align: 'right' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => <ChevronRight size={14} className="text-text-muted" />
    }
  ];

  return (
    <PageLayout
      title="Customer Intelligence Lab"
      subtitle="Strategic behavioral analysis, funnel exploration, and identity-aware journey tracking."
      icon={<Users size={24} />}
      eyebrow={<span>Identity analytics</span>}
    >
      <div className="space-y-6 pb-12">
        <CustomerDiscoveryHeader stats={summary} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BehavioralFunnel stages={intelligence?.funnel || []} loading={loading} />
              <SegmentIntelligence segments={intelligence?.segments || []} loading={loading} onSelect={() => undefined} />
            </div>

            <Card className="p-0 border-subtle overflow-hidden">
              <div className="p-4 border-b border-subtle flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                  <TableIcon size={18} className="text-text-muted" />
                  <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider text-text-muted">
                    Recent Identity Log
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input
                      type="text"
                      placeholder="Search identities..."
                      className="bg-surface border border-subtle rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary w-48"
                    />
                  </div>
                  <button type="button" className="p-1.5 rounded-lg border border-subtle bg-surface hover:bg-muted transition-all" aria-label="Filter identities">
                    <Filter size={14} className="text-text-muted" />
                  </button>
                </div>
              </div>
              <OperationalTable
                columns={identityColumns}
                data={intelligence?.recentIdentities || []}
                isLoading={loading}
                onRowClick={(customer) => {
                  setSelectedCustomer(customer);
                  setIsDrawerOpen(true);
                }}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-subtle">
              <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider text-text-muted mb-6 block border-b border-subtle pb-2">
                Behavioral Insights
              </Typography>
              <div className="space-y-4">
                {[
                  { title: 'Funnel leakage detected', detail: '14% drop in cart-to-checkout in mobile Safari users.', type: 'warning', icon: <Activity size={16} /> },
                  { title: 'Segment growth spike', detail: 'High-value VIP segment grew by 24% following v3.0 release.', type: 'success', icon: <Layers size={16} /> },
                  { title: 'Anomalous guest pattern', detail: 'Increased bot-like traffic detected from the DE region.', type: 'info', icon: <MapPin size={16} /> }
                ].map((insight, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-subtle bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className={insight.type === 'warning' ? 'p-2 rounded-lg bg-warning/10 text-warning' : insight.type === 'success' ? 'p-2 rounded-lg bg-success/10 text-success' : 'p-2 rounded-lg bg-info/10 text-info'}>
                        {insight.icon}
                      </div>
                      <div>
                        <Typography variant="body" weight="bold" className="text-sm block">
                          {insight.title}
                        </Typography>
                        <Typography variant="micro" className="text-text-muted mt-1 block">
                          {insight.detail}
                        </Typography>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-subtle">
              <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider text-text-muted mb-6 block border-b border-subtle pb-2">
                Top Traffic Attribution
              </Typography>
              <div className="space-y-3">
                {intelligence?.topAttribution?.map((attr: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold">{attr.source}</span>
                      <span className="text-primary font-bold">{attr.conversion}% CR</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(attr.sessions / 5000) * 100}%` }} />
                    </div>
                    <Typography variant="micro" className="text-text-muted">
                      {attr.sessions.toLocaleString()} sessions
                    </Typography>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <DiagnosticDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Customer Identity Profile"
        subtitle={`Identity ID: ${selectedCustomer?.id} • Lifecycle: ${selectedCustomer?.state}`}
        width="700px"
      >
        {selectedCustomer && (
          <div className="space-y-8">
            <section className="flex items-center gap-6 p-6 bg-muted/20 rounded-3xl border border-subtle">
              <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold border-4 border-surface shadow-xl">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <Typography variant="h2" weight="bold" noMargin>
                  {selectedCustomer.name}
                </Typography>
                <Typography variant="body" className="text-text-muted flex items-center gap-2">
                  <Mail size={14} /> {selectedCustomer.email}
                </Typography>
                <div className="flex gap-2 mt-3">
                  <Badge variant="success" size="sm">{selectedCustomer.state}</Badge>
                  <Badge variant="default" size="sm">ID Verified</Badge>
                  <Badge variant="default" size="sm">2FA Active</Badge>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-subtle space-y-3">
                <div className="flex items-center gap-2 text-text-muted">
                  <Calendar size={16} />
                  <Typography variant="micro" weight="bold" className="uppercase tracking-wider">Customer Since</Typography>
                </div>
                <Typography variant="body" weight="bold" className="text-sm">October 24, 2025</Typography>
              </div>
              <div className="p-4 rounded-2xl border border-subtle space-y-3">
                <div className="flex items-center gap-2 text-text-muted">
                  <Globe size={16} />
                  <Typography variant="micro" weight="bold" className="uppercase tracking-wider">Origin Tracking</Typography>
                </div>
                <Typography variant="body" weight="bold" className="text-sm">London, GB • Virgin Media</Typography>
              </div>
            </div>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-text-muted" />
                  <Typography variant="h3" weight="bold" noMargin className="text-sm">Behavioral Journey</Typography>
                </div>
                <Button variant="ghost" size="sm">View full session log</Button>
              </div>
              <div className="space-y-0 border-l border-subtle ml-2 pl-6">
                {[
                  { time: '2m ago', event: 'Purchased Order #4421', desc: 'Basket Value: $244.10', icon: <Shield className="text-success" /> },
                  { time: '12m ago', event: 'Completed Checkout Stage 3', desc: 'Payment Method: Visa • 4421', icon: <Clock /> },
                  { time: '4h ago', event: 'Session Started (Direct)', desc: 'Device: Apple iPhone 15 Pro • iOS 17.4', icon: <Smartphone /> },
                  { time: '2d ago', event: 'Engaged with Loyalty Reward', desc: 'Claimed: 15% Welcome Discount', icon: <Activity className="text-primary" /> }
                ].map((item, idx) => (
                  <div key={idx} className="relative pb-6 last:pb-0">
                    <div className="absolute left-[-31px] top-1 w-2.5 h-2.5 rounded-full bg-surface border-2 border-primary" />
                    <div className="flex justify-between items-start">
                      <div>
                        <Typography variant="body" weight="bold" className="text-sm">{item.event}</Typography>
                        <Typography variant="micro" className="text-text-muted mt-1 block">{item.desc}</Typography>
                      </div>
                      <Typography variant="micro" className="text-text-muted font-bold uppercase">{item.time}</Typography>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-4 border-t border-subtle flex gap-4">
              <button type="button" className="action-btn action-btn--primary" style={{ flex: 1 }}>
                <Search size={16} />
                Analyze Path
              </button>
              <button type="button" className="action-btn action-btn--outline" style={{ flex: 1 }}>
                Re-Link Identity
              </button>
            </section>
          </div>
        )}
      </DiagnosticDrawer>
    </PageLayout>
  );
}
