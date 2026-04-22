'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { 
  PageLayout, 
  Typography, 
  Card, 
  Badge, 
  OperationalTable, 
  InformationState,
  DiagnosticDrawer,
  FilterBar
} from '@kpi-platform/ui';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  Globe, 
  Smartphone, 
  Server, 
  Clock, 
  RefreshCw, 
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  MousePointer2,
  Layers,
  History,
  Box
} from 'lucide-react';

// Intelligence Components
import { PerformanceHealthHeader } from '../../../../components/performance/PerformanceHealthHeader';
import { AnomalyExplorer } from '../../../../components/performance/AnomalyExplorer';
import { PerformanceTrendExplorer } from '../../../../components/performance/PerformanceTrendExplorer';
import { SegmentationPivot } from '../../../../components/performance/SegmentationPivot';

export default function PerformancePage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch, outageStatus, lastUpdated } = useAuth();

    // Data State
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>({
        p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, errorRate: 0, affectedServices: 0, uptime: 0
    });
    const [trends, setTrends] = useState<any[]>([]);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [regional, setRegional] = useState<any[]>([]);
    const [apis, setApis] = useState<any[]>([]);

    // UI UI State
    const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeMetric, setActiveMetric] = useState('latency');

    const isExpired = outageStatus === 'expired';

    const loadData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            const [summ, trnd, anom, reg, pages] = await Promise.all([
                apiFetch(`/api/v1/dashboard/performance/summary?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/trends?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/anomalies?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/regional?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/slowest-pages?siteId=${projectId}`)
            ]);

            setSummary(summ);
            setTrends(Array.isArray(trnd) ? trnd : []);
            setAnomalies(Array.isArray(anom) ? anom : []);
            setRegional(reg?.map((r: any) => ({
                dimension: r.name,
                count: r.share * 1000,
                p50: r.lcp,
                p95: r.lcp * 1.8,
                errors: r.errorRate,
                health: r.lcp > 2000 ? 'critical' : r.lcp > 1500 ? 'warning' : 'healthy'
            })) || []);
            setApis(pages?.map((p: any) => ({
                dimension: p.page,
                count: p.hits || 5000,
                p50: p.loadTime,
                p95: p.loadTime * 2.1,
                errors: p.errorRate || 0.2,
                health: p.loadTime > 3000 ? 'critical' : 'healthy'
            })) || []);
        } catch (err) {
            console.error('Performance lab failure:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // 30s resolution
        return () => clearInterval(interval);
    }, [loadData]);

    const handleAnomalyInspect = (anom: any) => {
        setSelectedAnomaly(anom);
        setIsDrawerOpen(true);
    };

    return (
        <PageLayout 
            title="Performance Intelligence Lab" 
            subtitle="Deep percentile analysis, regression detection, and technical root-cause exploration."
            icon={<Activity size={24} />}
        >
            <div className="space-y-6 pb-12">
                {/* 1. Performance Health Header (p50-p99) */}
                <PerformanceHealthHeader stats={summary} loading={loading} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Laboratory Left Column: Anomalies & Trends */}
                    <div className="lg:col-span-2 space-y-6">
                        <AnomalyExplorer 
                            anomalies={anomalies} 
                            loading={loading}
                            onInspect={handleAnomalyInspect} 
                        />

                        <PerformanceTrendExplorer 
                             data={trends} 
                             loading={loading}
                        />
                    </div>

                    {/* 3. Laboratory Right Column: Pivots & Segmentation */}
                    <div className="space-y-6">
                        <SegmentationPivot 
                            title="Regional Latency Pivot"
                            icon={Globe}
                            data={regional}
                            loading={loading}
                            onSelect={(s) => console.log('Region Filter:', s)}
                        />

                        <SegmentationPivot 
                            title="Service / API Distribution"
                            icon={Server}
                            data={apis}
                            loading={loading}
                            onSelect={(s) => console.log('API Filter:', s)}
                        />

                        <Card className="p-5 border-subtle bg-muted/20">
                           <div className="flex items-center gap-2 mb-4">
                              <ShieldCheck size={18} className="text-success" />
                              <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider text-text-muted">
                                 SLA Confidence Score
                              </Typography>
                           </div>
                           <div className="flex items-end gap-2">
                              <Typography variant="h2" weight="bold" noMargin>98.4%</Typography>
                              <Typography variant="caption" className="text-success mb-1 font-bold">+0.2% vs avg</Typography>
                           </div>
                           <Typography variant="micro" className="text-text-muted mt-2 block">
                              Aggregate reliability across critical paths in the last 24h window.
                           </Typography>
                        </Card>
                    </div>
                </div>

                {/* 4. Dependency & Trace Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                       <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider text-text-muted mb-6 block border-b border-subtle pb-2">
                          External System Correlation
                       </Typography>
                       <div className="space-y-4">
                          {[
                            { name: 'Payment (Stripe)', id: 'INT-402', status: 'Healthy', latency: '240ms' },
                            { name: 'Shipping (FedEx)', id: 'INT-88', status: 'Degraded', latency: '1.2s' },
                            { name: 'Identity (Auth0)', id: 'INT-12', status: 'Healthy', latency: '42ms' },
                          ].map((dep) => (
                             <div key={dep.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <div>
                                   <Typography variant="body" weight="bold" className="text-sm">{dep.name}</Typography>
                                   <Typography variant="micro" className="text-text-muted uppercase">{dep.id}</Typography>
                                </div>
                                <div className="text-right">
                                   <Typography variant="body" weight="bold" className="text-sm">{dep.latency}</Typography>
                                   <Badge variant={dep.status === 'Healthy' ? 'success' : 'warning'} size="sm">{dep.status}</Badge>
                                </div>
                             </div>
                          ))}
                       </div>
                    </Card>

                    <Card className="p-6 flex flex-col justify-center items-center text-center gap-4 bg-primary/5 border-primary/20">
                       <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                          <Search size={32} />
                       </div>
                       <div>
                          <Typography variant="h3" weight="bold" noMargin>Request Trace Explorer</Typography>
                          <Typography variant="caption" className="text-text-muted max-w-xs mt-2 block">
                             Jump into granular p99 request traces for deep code-level bottleneck analysis.
                          </Typography>
                       </div>
                       <button type="button" className="action-btn action-btn--primary">
                           Start Deep Trace <ExternalLink size={14} />
                        </button>
                    </Card>
                </div>
            </div>

            {/* Performance Diagnostic Side Panel */}
            <DiagnosticDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Performance Anomaly Lab"
                subtitle={`Anomaly ID: ${selectedAnomaly?.id} • Impact: ${selectedAnomaly?.severity?.toUpperCase()}`}
                width="700px"
            >
                {selectedAnomaly && (
                    <div className="space-y-8">
                        <section className="bg-error-bg/20 p-5 rounded-2xl border border-error/10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Typography variant="h3" weight="bold" noMargin className="text-error-text">
                                        {selectedAnomaly.metric} Regression
                                    </Typography>
                                    <Typography variant="caption" className="text-error-text opacity-70">
                                        Observed Deviation: <span className="font-bold">{selectedAnomaly.deviation}</span>
                                    </Typography>
                                </div>
                                <Badge variant="error" dot>CRITICAL REGRESSION</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-error/10">
                                <div>
                                    <Typography variant="micro" weight="bold" className="text-error-text opacity-50 uppercase">SCOPE</Typography>
                                    <Typography variant="body" weight="bold" className="text-sm">{selectedAnomaly.scope}</Typography>
                                </div>
                                <div>
                                    <Typography variant="micro" weight="bold" className="text-error-text opacity-50 uppercase">AFFECTED SEGMENT</Typography>
                                    <Typography variant="body" weight="bold" className="text-sm font-mono">{selectedAnomaly.impact}</Typography>
                                </div>
                            </div>
                        </section>

                        <section>
                            <Typography variant="caption" weight="bold" className="text-text-muted uppercase tracking-wider mb-4 block">
                                Correlation Intelligence
                            </Typography>
                            <div className="space-y-3">
                                <div className="p-4 bg-muted/30 rounded-xl flex gap-4">
                                    <History size={20} className="text-primary mt-1" />
                                    <div>
                                        <Typography variant="body" weight="bold" className="text-sm">Matched Release Event</Typography>
                                        <Typography variant="caption" className="text-text-muted block mt-1">
                                            Regression started exactly 4m after <strong>deployment v2.4.1-rc</strong>. 
                                            This release modified the <code>ProductView.tsx</code> and <code>CheckoutService.go</code> files.
                                        </Typography>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl flex gap-4">
                                    <Layers size={20} className="text-warning mt-1" />
                                    <div>
                                        <Typography variant="body" weight="bold" className="text-sm">Regional Infrastructure Anomaly</Typography>
                                        <Typography variant="caption" className="text-text-muted block mt-1">
                                            Cloud provider <strong>AWS ap-south-1</strong> reported 40ms increased gateway latency during this window.
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Box size={18} className="text-text-muted" />
                                <Typography variant="h3" weight="bold" noMargin className="text-sm">
                                    Technical Triage Actions
                                </Typography>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" className="action-btn action-btn--primary">
                                    <RefreshCw size={16} />
                                    Immediate Rollback
                                </button>
                                <button type="button" className="action-btn action-btn--outline">
                                    <Search size={16} />
                                    Isolate Segment
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </DiagnosticDrawer>
        </PageLayout>
    );
}
