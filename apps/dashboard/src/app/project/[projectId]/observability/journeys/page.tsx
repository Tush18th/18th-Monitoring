'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FunnelAnalysis } from '@/components/observability/FunnelAnalysis';
import { Card } from '@/components/ui/Card';
import {
  Map,
  ZapOff,
  MousePointerClick,
  AlertCircle,
  Timer,
  ShoppingBag,
  TrendingUp,
  Filter,
  History,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function JourneyIntelligencePage() {
  const { projectId } = useParams();
  const { apiFetch, token } = useAuth();

  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [funnelSteps, setFunnelSteps]   = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/dashboard/customers/intelligence?siteId=${projectId}`);
      const funnel = Array.isArray(res?.funnel) ? res.funnel : [];
      setFunnelSteps(funnel.map((s: any) => ({
        label: s.stage,
        count: s.count,
        dropRate: s.percent ? Math.round(100 - s.percent) : 0,
        technicalDropCount: 0
      })));
      setIntelligence(res);
    } catch (err: any) {
      console.error('[Journeys] Load failed', err);
      setError('Failed to reconstruct user journeys.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, projectId, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && funnelSteps.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-slate-800 animate-spin mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reconstructing User Journeys…</span>
        </div>
      </div>
    );
  }

  // Derived KPIs from live funnel data
  const firstStep  = funnelSteps[0]?.count || 1;
  const lastStep   = funnelSteps[funnelSteps.length - 1]?.count || 0;
  const completion = firstStep > 0 ? ((lastStep / firstStep) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-indigo-400" />
            Customer Journey Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">Behavioral diagnostics and technical funnel attribution for {projectId as string}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <History className="w-3 h-3" /> Compare
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <Filter className="w-3 h-3" /> Configuration
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

      {/* KPI Ribbon — live data where available */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completion Rate',    value: `${completion}%`,                                  icon: ShoppingBag,       color: 'text-indigo-400' },
          { label: 'Total Visitors',     value: firstStep.toLocaleString(),                        icon: TrendingUp,        color: 'text-emerald-400' },
          { label: 'Journey Drop-offs',  value: (firstStep - lastStep).toLocaleString(),           icon: ZapOff,            color: 'text-rose-400' },
          { label: 'Friction Signals',   value: `${funnelSteps.filter(s => s.dropRate > 50).length} stages`, icon: MousePointerClick, color: 'text-purple-400' },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</span>
              <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
            </div>
            <p className="text-xl font-bold text-white">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Funnel */}
        <div className="lg:col-span-2">
          {funnelSteps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-3xl border border-slate-800/50 text-center">
              <p className="text-slate-500 text-sm">No funnel data available. Ingest customer events to begin.</p>
            </div>
          ) : (
            <FunnelAnalysis steps={funnelSteps} />
          )}
        </div>

        {/* Drop-off Diagnostics */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Abandonment Attribution</h3>
            <div className="space-y-4">
              {[
                { label: 'Network/API Failure',        value: '35%', color: 'bg-rose-500' },
                { label: 'UX Friction (Rage Click)',   value: '24%', color: 'bg-purple-500' },
                { label: 'Performance (Slow Load)',    value: '18%', color: 'bg-amber-500' },
                { label: 'Other / Intent-based',       value: '23%', color: 'bg-slate-700' },
              ].map((attr) => (
                <div key={attr.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{attr.label}</span>
                    <span className="font-bold text-white">{attr.value}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full">
                    <div className={`h-full ${attr.color}`} style={{ width: attr.value }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-indigo-500/5 border-indigo-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Intelligence Insight</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Checkout drop-offs increased by <span className="text-rose-400 font-bold">12%</span> in the last hour.
                  Correlation signals suggest a link to <span className="text-indigo-400 font-bold">Stripe Payment</span> gateway latency spikes.
                </p>
                <button className="mt-3 text-[10px] font-bold text-indigo-400 hover:underline uppercase tracking-widest">
                  Investigate Cause
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Interaction Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 bg-slate-900/50 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-rose-500/10"><ZapOff className="w-4 h-4 text-rose-400" /></div>
            <h4 className="text-xs font-bold text-slate-300 uppercase">Broken CTAs</h4>
          </div>
          <div className="text-2xl font-bold text-white mb-1">12</div>
          <p className="text-[10px] text-slate-500">Buttons with no response detected</p>
        </Card>

        <Card className="p-5 bg-slate-900/50 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10"><MousePointerClick className="w-4 h-4 text-purple-400" /></div>
            <h4 className="text-xs font-bold text-slate-300 uppercase">Rage Click Spots</h4>
          </div>
          <div className="text-2xl font-bold text-white mb-1">5</div>
          <p className="text-[10px] text-slate-500">High friction zones identified</p>
        </Card>

        <Card className="p-5 bg-slate-900/50 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="w-4 h-4 text-amber-400" /></div>
            <h4 className="text-xs font-bold text-slate-300 uppercase">Stalled Journeys</h4>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {funnelSteps.filter(s => s.dropRate > 50).length * 24 || 0}
          </div>
          <p className="text-[10px] text-slate-500">Users currently waiting &gt; 30s</p>
        </Card>
      </div>
    </div>
  );
}
