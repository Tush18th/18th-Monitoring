'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AlertList } from '@/components/observability/AlertList';
import { Card } from '@/components/ui/Card';
import {
  Bell,
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Settings,
  History,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AlertCenterPage() {
  const { projectId } = useParams();
  const { apiFetch, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [alerts, setAlerts]   = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/dashboard/alerts?siteId=${projectId}`);
      // Handle both {alerts:[]} and plain []
      const list = Array.isArray(res) ? res : (res?.alerts ?? []);
      setAlerts(list);
    } catch (err: any) {
      console.error('[AlertCenter] Load failed', err);
      setError('Failed to synchronize operational signals.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, projectId, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Derive stats from live alerts
  const stats = useMemo(() => {
    const active   = alerts.filter(a => a.status === 'active');
    const critical = active.filter(a => a.severity === 'critical');
    const resolved = alerts.filter(a => a.status === 'resolved');
    return { active: active.length, critical: critical.length, resolved: resolved.length };
  }, [alerts]);

  // Map backend alert shape → AlertList component shape
  const mappedAlerts = useMemo(() => alerts.map(a => ({
    id: a.alertId || a.id,
    title: a.message || a.kpiName || 'Alert',
    severity: (a.severity?.toUpperCase() as any) || 'HIGH',
    status: a.status === 'active' ? ('ACTIVE' as const) : ('RESOLVED' as const),
    timestamp: a.triggeredAt ? new Date(a.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    source: a.module || a.affectedEntity || 'System',
  })), [alerts]);

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-slate-800 animate-spin mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Operational Signals…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            Alert Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time operational alerts and threshold monitoring for {projectId as string}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <History className="w-3 h-3" /> Audit Log
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 flex items-center gap-2 transition-colors">
            <Settings className="w-3 h-3" /> Rule Config
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={loadData} className="ml-auto text-xs underline hover:text-white">Retry</button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Alerts',   value: String(stats.active),   color: 'text-rose-400',    icon: ShieldAlert },
          { label: 'Critical',        value: String(stats.critical),  color: 'text-rose-500',    icon: AlertTriangle },
          { label: 'Resolved (live)', value: String(stats.resolved),  color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Total Signals',   value: String(alerts.length),   color: 'text-indigo-400',  icon: Search },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Severity Filter</h3>
            <div className="space-y-2">
              {['Critical', 'High', 'Medium', 'Low'].map((s) => (
                <label key={s} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-slate-700 bg-slate-800 group-hover:border-indigo-500 transition-colors" />
                  <span className="text-sm text-slate-400 group-hover:text-white">{s}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Signal Source</h3>
            <div className="space-y-2">
              {['Backend API', 'Frontend RUM', 'Synthetic', 'Journey Engine'].map((s) => (
                <label key={s} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-slate-700 bg-slate-800 group-hover:border-indigo-500 transition-colors" />
                  <span className="text-sm text-slate-400 group-hover:text-white">{s}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Alert List */}
        <div className="lg:col-span-3">
          {mappedAlerts.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-3xl border border-slate-800/50 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">All Clear</h3>
              <p className="text-slate-500 text-sm">No active alerts. All thresholds are within acceptable bounds.</p>
            </div>
          ) : (
            <AlertList alerts={mappedAlerts} />
          )}
        </div>
      </div>
    </div>
  );
}
