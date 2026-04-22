'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
   Siren,
   ShieldAlert,
   Activity,
   ScrollText,
   Clock,
   RefreshCw,
   CheckCircle2,
   ExternalLink,
   Search,
   Filter,
   History,
   Box,
   Server,
   User,
   Zap,
   Tag,
   ArrowRight
} from 'lucide-react';
import {
   PageLayout,
   Typography,
   Card,
   Badge,
   OperationalTable,
   DiagnosticDrawer,
   Column
} from '@kpi-platform/ui';
import { useAuth } from '../../../../context/AuthContext';

// Observability Components
import { ObservabilityHeader } from '../../../../components/observability/ObservabilityHeader';
import { UnifiedObservabilityTable } from '../../../../components/observability/UnifiedObservabilityTable';
import { UnifiedTimelineView } from '../../../../components/observability/UnifiedTimelineView';

export default function AlertsPage() {
   const params = useParams();
   const projectId = params.projectId as string;
   const { token, apiFetch } = useAuth();

   // Data State
   const [loading, setLoading] = useState(true);
   const [alerts, setAlerts] = useState<any[]>([]);
   const [auditLogs, setAuditLogs] = useState<any[]>([]);
   const [activityFeed, setActivityFeed] = useState<any[]>([]);

   // UI State
   const [selectedSignal, setSelectedSignal] = useState<{ type: string, data: any } | null>(null);
   const [isDrawerOpen, setIsDrawerOpen] = useState(false);

   const loadData = useCallback(async () => {
      if (!token || !projectId) return;
      setLoading(true);
      try {
         const [alrts, audit, activity] = await Promise.all([
            apiFetch(`/api/v1/dashboard/alerts?siteId=${projectId}`),
            apiFetch(`/api/v1/dashboard/audit?siteId=${projectId}`),
            apiFetch(`/api/v1/dashboard/activity?siteId=${projectId}`)
         ]);
          setAlerts(Array.isArray(alrts) ? alrts : alrts?.alerts || []);
         setAuditLogs(Array.isArray(audit) ? audit : []);
         setActivityFeed(Array.isArray(activity) ? activity : []);
      } catch (err) {
         console.error('Visibility layer failure:', err);
      } finally {
         setLoading(false);
      }
   }, [projectId, token, apiFetch]);

   useEffect(() => {
      loadData();
      const interval = setInterval(loadData, 30000); // 30s observability window
      return () => clearInterval(interval);
   }, [loadData]);

   const stats = useMemo(() => {
      const active = alerts.filter(a => a.status === 'active');
      return {
         activeAlerts: active.length,
         criticalAlerts: active.filter(a => a.severity === 'critical').length,
         unresolvedIncidents: active.length,
         recentAuditActions: auditLogs.length
      };
   }, [alerts, auditLogs]);

   const timelineEvents = useMemo(() => {
      const events: any[] = [];

      alerts.slice(0, 5).forEach(a => events.push({
         id: `t-al-${a.alertId}`,
         type: 'alert',
         title: `${a.kpiName} Breach`,
         description: a.message,
         timestamp: a.triggeredAt,
         severity: a.severity
      }));

      auditLogs.slice(0, 3).forEach(a => events.push({
         id: `t-au-${a.id}`,
         type: 'audit',
         title: a.action,
         description: `${a.actor} modified ${a.entity}`,
         timestamp: a.timestamp
      }));

      activityFeed.slice(0, 2).forEach(a => events.push({
         id: `t-ac-${a.id}`,
         type: 'activity',
         title: a.type,
         description: a.description,
         timestamp: a.timestamp
      }));

      return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
   }, [alerts, auditLogs, activityFeed]);

   const handleSignalClick = (type: string, data: any) => {
      setSelectedSignal({ type, data });
      setIsDrawerOpen(true);
   };

   return (
      <PageLayout
         title="Alert Center & Observability"
         subtitle="Unified operational visibility layer for real-time incidents, audit trails, and system behavior."
         icon={<Siren size={24} />}
      >

         <div className="space-y-6 pb-12">
            {/* 1. Observability Health Header */}
            <ObservabilityHeader stats={stats} loading={loading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* 2. Laboratory Left Column: Multi-Source Table */}
               <div className="lg:col-span-2 space-y-6">
                  <UnifiedObservabilityTable
                     alerts={alerts}
                     audit={auditLogs}
                     activity={activityFeed}
                     onRowClick={handleSignalClick}
                     loading={loading}
                  />

                  {/* 3. Operational Signal Logic (Grouping/Resolution) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Card className="p-6 border-subtle">
                        <div className="flex items-center gap-2 mb-6">
                           <Zap size={18} className="text-primary" />
                           <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider text-text-muted">
                              Incident Resolution Velocity
                           </Typography>
                        </div>
                        <div className="flex items-end gap-2">
                           <Typography variant="h2" weight="bold" noMargin>14.2m</Typography>
                           <Typography variant="caption" className="text-success mb-1 font-bold">-4% vs avg</Typography>
                        </div>
                        <div className="mt-4 space-y-2">
                           <div className="flex justify-between text-xs">
                              <span className="text-text-muted text-[10px] font-bold">MTTR PROGRESS</span>
                              <span className="font-bold">78% Target Met</span>
                           </div>
                           <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-success" style={{ width: '78%' }} />
                           </div>
                        </div>
                     </Card>

                     <Card className="p-6 border-subtle bg-muted/20">
                        <div className="flex items-center gap-2 mb-6 text-text-muted">
                           <History size={18} />
                           <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider">
                              Deduplication Intelligence
                           </Typography>
                        </div>
                        <Typography variant="body" weight="bold" className="text-sm block">12 Alerts Suppressed</Typography>
                        <Typography variant="micro" className="text-text-muted mt-1 block">
                           Deduplication engine active. Grouping related signals into parent incidents.
                        </Typography>
                     </Card>
                  </div>
               </div>

               {/* 4. Laboratory Right Column: Timeline View */}
               <div className="space-y-6">
                  <UnifiedTimelineView
                     events={timelineEvents}
                     loading={loading}
                  />

                  <Card className="p-5 border-dashed border-subtle flex flex-col items-center text-center gap-3">
                     <div className="p-2 rounded-xl bg-muted text-text-muted">
                        <Search size={24} />
                     </div>
                     <Typography variant="body" weight="bold" className="text-sm">Global Observation Query</Typography>
                     <Typography variant="micro" className="text-text-muted">
                        Quickly search across logs, traces, and sessions matching alert IDs.
                     </Typography>
                     <button type="button" className="action-btn action-btn--outline action-btn--wide" style={{ marginTop: '0.5rem' }}>
                        Open Log Explorer
                     </button>
                  </Card>
               </div>
            </div>
         </div>

         {/* Signal Diagnostic Side Panel */}
         <DiagnosticDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title={`${selectedSignal?.type.toUpperCase()} SIGNAL INVESTIGATION`}
            subtitle={`Signal ID: ${selectedSignal?.data?.alertId || selectedSignal?.data?.id}`}
            width="700px"
         >
            {selectedSignal && (
               <div className="space-y-8">
                  {/* 1. Incident Status Layer */}
                  <section className={`p-6 rounded-3xl border ${selectedSignal.type === 'alert' ? 'bg-error-bg/20 border-error/10' : 'bg-muted/20 border-subtle'
                     }`}>
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <Badge variant={selectedSignal.type === 'alert' ? 'error' : 'default'} size="sm" dot>
                              {selectedSignal.type.toUpperCase()}
                           </Badge>
                           <Typography variant="h2" weight="bold" noMargin className="mt-2">
                              {selectedSignal.data.kpiName || selectedSignal.data.action || selectedSignal.data.type}
                           </Typography>
                        </div>
                        {selectedSignal.type === 'alert' && (
                           <div className="text-right">
                              <Typography variant="micro" weight="bold" className="text-text-muted uppercase">Lifecycle</Typography>
                              <Badge variant="error" size="sm" className="mt-1">{selectedSignal.data.status.toUpperCase()}</Badge>
                           </div>
                        )}
                     </div>

                     <Typography variant="body" className="text-text-secondary leading-relaxed">
                        {selectedSignal.data.message || selectedSignal.data.description || `Transformation of ${selectedSignal.data.entity}`}
                     </Typography>

                     {selectedSignal.type === 'alert' && (
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-error/10">
                           <div>
                              <Typography variant="micro" weight="bold" className="text-text-muted uppercase">Affected Entity</Typography>
                              <Typography variant="body" weight="bold" className="text-sm">{selectedSignal.data.affectedEntity}</Typography>
                           </div>
                           <div>
                              <Typography variant="micro" weight="bold" className="text-text-muted uppercase">Module Signature</Typography>
                              <Typography variant="body" weight="bold" className="text-sm font-mono">{selectedSignal.data.module}</Typography>
                           </div>
                        </div>
                     )}
                  </section>

                  {/* 2. Observability Context (Who, When, Where) */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl border border-subtle space-y-3">
                        <div className="flex items-center gap-2 text-text-muted">
                           <User size={16} />
                           <Typography variant="micro" weight="bold" className="uppercase tracking-wider">Trigger Actor</Typography>
                        </div>
                        <Typography variant="body" weight="bold" className="text-sm">
                           {selectedSignal.data.actor || 'Automatic System Rule'}
                        </Typography>
                     </div>
                     <div className="p-4 rounded-2xl border border-subtle space-y-3">
                        <div className="flex items-center gap-2 text-text-muted">
                           <Clock size={16} />
                           <Typography variant="micro" weight="bold" className="uppercase tracking-wider">Detection Event</Typography>
                        </div>
                        <Typography variant="body" weight="bold" className="text-sm">
                           {selectedSignal.data.triggeredAt || selectedSignal.data.timestamp}
                        </Typography>
                     </div>
                  </div>

                  {/* 3. Event Correlation Log */}
                  <section>
                     <div className="flex items-center gap-2 mb-4">
                        <Box size={18} className="text-text-muted" />
                        <Typography variant="h3" weight="bold" noMargin className="text-sm">Correlation Intelligence</Typography>
                     </div>
                     <div className="space-y-3">
                        <div className="p-4 bg-muted/30 rounded-xl flex gap-4 border border-subtle transition-all hover:border-primary/20">
                           <Zap size={20} className="text-primary mt-1" />
                           <div>
                              <Typography variant="body" weight="bold" className="text-sm">Performance Anomaly during event</Typography>
                              <Typography variant="micro" className="text-text-muted block mt-1">
                                 System detected 420ms p95 latency spike in Checkout API matching this signal window.
                              </Typography>
                           </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl flex gap-4 border border-subtle transition-all hover:border-primary/20">
                           <ScrollText size={20} className="text-warning mt-1" />
                           <div>
                              <Typography variant="body" weight="bold" className="text-sm">Matched Audit Trail Entry</Typography>
                              <Typography variant="micro" className="text-text-muted block mt-1">
                                 Admin changed Stripe SLA threshold 4m prior to this alert triggering.
                              </Typography>
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* 4. Action Layer */}
                  <section className="pt-4 border-t border-subtle space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <Tag size={16} className="text-text-muted" />
                        <Typography variant="micro" weight="bold" className="uppercase text-text-muted">Resolution Actions</Typography>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="action-btn action-btn--primary">
                           <CheckCircle2 size={16} />
                           Acknowledge & Triage
                        </button>
                        <button type="button" className="action-btn action-btn--outline">
                           <RefreshCw size={16} />
                           Attempt Auto-Remediation
                        </button>
                     </div>
                     <button type="button" className="action-btn action-btn--ghost action-btn--wide">
                        View Service Trace <ExternalLink size={16} />
                     </button>
                  </section>
               </div>
            )}
         </DiagnosticDrawer>
      </PageLayout>
   );
}
