'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SyntheticUptime } from '@/components/observability/SyntheticUptime';
import { Card } from '@/components/ui/Card';
import {
  Activity,
  Terminal,
  History,
  Settings,
  ExternalLink,
  AlertCircle,
  Play,
  Monitor,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SyntheticMonitoringPage() {
  const { projectId } = useParams();
  const { apiFetch, token } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [summary, setSummary]       = useState<any[]>([]);
  const [runHistory, setRunHistory] = useState<any[]>([]);
  const [failures, setFailures]     = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, hist, fails] = await Promise.all([
        apiFetch(`/api/v1/dashboard/synthetic/dashboard?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/synthetic/history?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/synthetic/failures?siteId=${projectId}`),
      ]);
      setSummary(Array.isArray(dash) ? dash : []);
      setRunHistory(Array.isArray(hist) ? hist : []);
      setFailures(Array.isArray(fails) ? fails : []);
    } catch (err: any) {
      console.error('[Synthetic] Load failed', err);
      setError('Failed to synchronize synthetic telemetry.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, projectId, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Derived stats
  const passedRuns  = runHistory.filter((r: any) => r.success_status === true || r.success_status === undefined).length;
  const totalRuns   = runHistory.length || 1;
  const uptimePct   = Math.round((passedRuns / totalRuns) * 1000) / 10;
  const lastRunPass = runHistory[0]?.success_status !== false;
  const lastRunTime = runHistory[0]?.timestamp
    ? new Date(runHistory[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  if (loading && runHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-slate-800 animate-spin mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Orchestrating Proactive Checks…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sync Failed</h2>
        <p className="text-slate-400 text-sm max-w-md mb-8">{error}</p>
        <button onClick={loadData}
          className="px-6 py-2 rounded-full bg-slate-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center gap-2">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Synthetic Monitoring
          </h1>
          <p className="text-slate-400 text-sm mt-1">Proactive availability and flow validation for {projectId as string}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <Play className="w-3 h-3" /> Run Now
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <Settings className="w-3 h-3" /> Config
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uptime and Summary */}
        <div className="lg:col-span-2 space-y-6">
          <SyntheticUptime
            percentage={uptimePct}
            lastRunStatus={lastRunPass ? 'PASS' : 'FAIL'}
            lastRunTime={lastRunTime}
            history={runHistory}
          />

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Monitored Journeys</h3>
            {summary.length === 0 ? (
              <p className="text-slate-500 text-xs">No journey data yet. Ingest a synthetic run to populate.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.map((j: any) => (
                  <div key={j.journey} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <Monitor className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${j.successRate >= 95 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${j.successRate >= 95 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {j.successRate >= 95 ? 'Passing' : 'Degraded'}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{j.journey}</h4>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Success Rate</p>
                        <p className="text-xs font-bold text-slate-200">{j.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Avg Duration</p>
                        <p className="text-xs font-bold text-slate-200">{j.avgTime ? `${(j.avgTime / 1000).toFixed(1)}s` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Latest Failures */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900/50 border-slate-800 h-full">
            <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Recent Failure Events</h3>
            {failures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
                <p className="text-slate-400 text-xs">No failures detected in recent runs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {failures.slice(0, 4).map((fail: any, i: number) => (
                  <div key={i} className="group relative p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        {fail.error_logs?.split(' ')[0] || 'FAILURE'}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {fail.timestamp ? new Date(fail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 mb-1">{fail.journey_name}</p>
                    <p className="text-[10px] text-slate-500">
                      Failed at step: <span className="text-rose-300 font-medium">{fail.step_name || 'Unknown Step'}</span>
                    </p>
                    <div className="mt-3 flex gap-2">
                      {fail.screenshot_url && (
                        <button className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase hover:underline">
                          <Camera className="w-3 h-3" /> Screenshot
                        </button>
                      )}
                      <button className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase hover:underline">
                        <ExternalLink className="w-3 h-3" /> Trace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Full Run History */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4" /> Comprehensive Execution History
          </h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-400">{runHistory.length} runs</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-4 text-xs font-semibold text-slate-500">STATUS</th>
                <th className="pb-4 text-xs font-semibold text-slate-500">JOURNEY</th>
                <th className="pb-4 text-xs font-semibold text-slate-500">RUN ID</th>
                <th className="pb-4 text-xs font-semibold text-slate-500">DURATION</th>
                <th className="pb-4 text-xs font-semibold text-slate-500">COMPLETED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {runHistory.slice(0, 20).map((run: any, i: number) => (
                <tr key={run.runId || i} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    {run.success_status !== false ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> FAILED
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-sm font-medium text-slate-300">{run.journey_name || run.journey || '—'}</td>
                  <td className="py-4 text-xs font-mono text-slate-500">{run.runId || `run_${i}`}</td>
                  <td className="py-4 text-sm text-slate-400">
                    {run.execution_time ? `${(run.execution_time / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="py-4 text-sm text-slate-500">
                    {run.timestamp ? new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
              {runHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-600 text-sm">
                    No run history yet. Trigger a synthetic run to begin recording.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
