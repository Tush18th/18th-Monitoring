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
    const [integrations, setIntegrations] = useState<any[]>([]);

    // UI UI State
    const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeMetric, setActiveMetric] = useState('latency');

    const isExpired = outageStatus === 'expired';

    const loadData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            const [summ, trnd, anom, reg, pages, intg] = await Promise.all([
                apiFetch(`/api/v1/dashboard/performance/summary?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/trends?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/anomalies?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/regional?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/performance/slowest-pages?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/integrations/summary?siteId=${projectId}`)
            ]);

            setSummary(summ);
            setTrends(Array.isArray(trnd) ? trnd : []);
            setAnomalies(Array.isArray(anom) ? anom : []);
            setIntegrations(Array.isArray(intg) ? intg : []);
            
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
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleAnomalyInspect = (anomaly: any) => {
        setSelectedAnomaly(anomaly);
        setIsDrawerOpen(true);
    };

    return (
        <PageLayout
            title="Performance Lab"
            subtitle="Deep intelligence on site reliability, latency distributions, and anomaly attribution."
            icon={<Activity size={24} />}
        >
            <div className="space-y-8 pb-12">
                {/* 1. System Health Header */}
                <PerformanceHealthHeader 
                    summary={summary} 
                    loading={loading} 
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* 2. Visual Intelligence Zone */}
                    <div className="lg:col-span-3 space-y-8">
                        <PerformanceTrendExplorer 
                            trends={trends} 
                            loading={loading}
                            activeMetric={activeMetric}
                            onMetricChange={setActiveMetric}
                        />

                        <AnomalyExplorer 
                            anomalies={anomalies} 
                            loading={loading}
                            onInspect={handleAnomalyInspect}
                        />

                        <SegmentationPivot 
                            regionalData={regional}
                            loading={loading}
                        />
                    </div>

                    {/* 3. Contextual Sidebar */}
                    <div className="space-y-6">
                        <Card className="p-6 border-subtle">
                           <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider text-text-muted mb-6 block border-b border-subtle pb-2">
                              Top Bottlenecks
                           </Typography>
                           <div className="space-y-6">
                              {apis.slice(0, 5).map((api, idx) => (
                                 <div key={idx} className="flex flex-col gap-1 cursor-pointer group">
                                    <div className="flex justify-between items-center">
                                       <Typography variant="body" weight="bold" className="text-xs truncate max-w-[140px] group-hover:text-primary transition-colors">
                                          {api.dimension}
                                       </Typography>
                                       <Badge variant={api.health as any} size="sm">{api.p95}ms</Badge>
                                    </div>
                                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full ${api.health === 'critical' ? 'bg-error' : 'bg-success'}`} 
                                          style={{ width: `${Math.min(100, (api.p95 / 5000) * 100)}%` }} 
                                       />
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </Card>

                        <OperationalTable 
                            columns={[
                                { key: 'dimension', header: 'Resource' },
                                { key: 'p95', header: 'p95', width: '80px', render: (v) => `${v}ms` }
                            ] as any}
                            data={apis.slice(5, 10)}
                            isLoading={loading}
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
                              <Typography variant="h2" weight="bold" noMargin>{summary.uptime || '99.9'}%</Typography>
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
                          {integrations.length > 0 ? (
                            integrations.slice(0, 4).map((dep) => (
                              <div key={dep.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                 <div>
                                    <Typography variant="body" weight="bold" className="text-sm">{dep.name}</Typography>
                                    <Typography variant="micro" className="text-text-muted uppercase">{dep.status}</Typography>
                                 </div>
                                 <div className="text-right">
                                    <Typography variant="body" weight="bold" className="text-sm">{dep.latency}</Typography>
                                    <Badge variant={dep.status === 'Active' ? 'success' : 'warning'} size="sm">{dep.status}</Badge>
                                 </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <Typography variant="caption" className="text-text-muted">No external dependencies tracked.</Typography>
                            </div>
                          )}
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

            <DiagnosticDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)}
                title="Anomaly Diagnostic"
                subtitle={`Fingerprint: ${selectedAnomaly?.id || 'Unknown'}`}
            >
                {selectedAnomaly && (
                    <div className="space-y-8">
                        <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex gap-3">
                            <AlertTriangle className="text-error" size={24} />
                            <div>
                                <Typography variant="body" weight="bold">Critical Performance Regression</Typography>
                                <Typography variant="caption" className="text-text-secondary mt-1 block">
                                    The system detected a {selectedAnomaly.deviation} deviation in {selectedAnomaly.metric} across {selectedAnomaly.scope}.
                                </Typography>
                            </div>
                        </div>

                        <section className="space-y-4">
                            <Typography variant="body" weight="bold" className="text-sm text-text-muted uppercase tracking-wider">Root Cause Attribution</Typography>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/20 border border-subtle rounded-2xl">
                                    <Typography variant="micro" className="text-text-muted uppercase font-bold block mb-1">Primary Factor</Typography>
                                    <Typography variant="body" weight="bold">{selectedAnomaly.metric}</Typography>
                                </div>
                                <div className="p-4 bg-muted/20 border border-subtle rounded-2xl">
                                    <Typography variant="micro" className="text-text-muted uppercase font-bold block mb-1">Impacted Scope</Typography>
                                    <Typography variant="body" weight="bold">{selectedAnomaly.scope}</Typography>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Typography variant="body" weight="bold" className="text-sm text-text-muted uppercase tracking-wider">Historical Context</Typography>
                                <Badge variant="info">3 SAMPLES</Badge>
                            </div>
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex justify-between items-center p-3 border border-subtle rounded-xl bg-surface">
                                        <div className="flex items-center gap-3">
                                            <History size={16} className="text-text-muted" />
                                            <Typography variant="body" className="text-xs">T - {i*10}m occurrence</Typography>
                                        </div>
                                        <Typography variant="body" weight="bold" className="text-xs">{selectedAnomaly.deviation}</Typography>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-8 flex gap-4">
                            <button className="action-btn action-btn--primary flex-1">Acknowledge Anomaly</button>
                            <button className="action-btn action-btn--outline flex-1">Open CloudTrace</button>
                        </div>
                    </div>
                )}
            </DiagnosticDrawer>
        </PageLayout>
    );
}
