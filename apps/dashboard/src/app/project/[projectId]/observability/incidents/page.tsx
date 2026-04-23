'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { 
  Flame, 
  ExternalLink, 
  MessageSquare, 
  History, 
  User, 
  Clock,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function IncidentCenterPage() {
  const { projectId } = useParams();
  const { apiFetch, token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [incResponse, perfResponse] = await Promise.all([
        apiFetch(`/api/v1/dashboard/incidents?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/performance/summary?siteId=${projectId}`)
      ]);
      setIncidents(Array.isArray(incResponse) ? incResponse : []);
      setPerformance(perfResponse);
    } catch (err: any) {
      console.error('[Incidents] Load failed', err);
      setError('Failed to synchronize incident timeline. Please check platform health.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, projectId, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-rose-500 border-slate-800 animate-spin mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Loading Incident Timeline…</span>
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
        <h2 className="text-xl font-bold text-white mb-2">Desync Detected</h2>
        <p className="text-slate-400 text-sm max-w-md mb-8">{error}</p>
        <button 
          onClick={loadData}
          className="px-6 py-2 rounded-full bg-slate-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3 h-3" /> Retry Sync
        </button>
      </div>
    );
  }

  const availabilityStatus = incidents.some(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED') ? 'Critical' : 'Nominal';
  const latencyStatus = (performance?.p95 > 3000) ? 'Degraded' : 'Nominal';
  const errorStatus = (performance?.errorRate > 2) ? 'Warning' : 'Nominal';

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-rose-500" />
            Incident Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Lifecycle management and evidence tracking for project {projectId}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-4 py-2 rounded-lg bg-rose-600 text-sm font-bold text-white hover:bg-rose-500 flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]">
            Create Manual Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incident List */}
        <div className="lg:col-span-2 space-y-6">
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-3xl border border-slate-800/50 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Zero Active Incidents</h3>
              <p className="text-slate-400 text-sm max-w-xs">All systems are currently performing within their defined SLA thresholds.</p>
            </div>
          ) : (
            incidents.map((inc) => (
              <Card key={inc.id} className="bg-slate-900/50 border-slate-800 overflow-hidden group">
                <div className="p-5 border-b border-slate-800/50 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{inc.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        inc.status === 'INVESTIGATING' || inc.status === 'OPEN' ? 'bg-rose-500/20 text-rose-400' : 
                        inc.status === 'MONITORING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {inc.status}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{inc.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{inc.impact}</p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
                <div className="px-5 py-3 bg-slate-950/50 flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] text-slate-400">{inc.owner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] text-slate-400">{new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5" /> Updates
                    </button>
                    <button className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:underline uppercase tracking-wider">
                      <ExternalLink className="w-3.5 h-3.5" /> Evidence
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar Diagnostics */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">Current Health Overview</h3>
            <div className="space-y-4">
              {[
                { label: 'Availability', value: availabilityStatus, color: availabilityStatus !== 'Nominal' ? 'text-rose-400' : 'text-emerald-400', icon: ShieldAlert },
                { label: 'Latency', value: latencyStatus, color: latencyStatus !== 'Nominal' ? 'text-amber-400' : 'text-emerald-400', icon: AlertTriangle },
                { label: 'Errors', value: errorStatus, color: errorStatus !== 'Nominal' ? 'text-rose-400' : 'text-emerald-400', icon: CheckCircle2 },
              ].map((h) => (
                <div key={h.label} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h.icon className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-xs text-slate-400">{h.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${h.color}`}>{h.value}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-2 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 uppercase hover:bg-slate-700 transition-colors">
              View Status Page
            </button>
          </Card>

          <Card className="p-6 bg-indigo-500/5 border-indigo-500/20">
            <History className="w-5 h-5 text-indigo-400 mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Knowledge Base</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on historical patterns, incidents involving <span className="text-indigo-400">Gateway Latency</span> are often resolved by scaling the <span className="text-slate-200">Payment-Sync</span> worker group.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
