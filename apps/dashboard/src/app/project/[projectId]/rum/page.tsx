'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WebVitalCard } from '@/components/rum/WebVitalCard';
import { EventStream } from '@/components/rum/EventStream';
import { DeviceDistribution } from '@/components/rum/DeviceDistribution';
import { Card } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe, Users, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RumDashboardPage() {
  const { projectId } = useParams();
  const { apiFetch, token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [webVitals, setWebVitals] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loadTimeTrend, setLoadTimeTrend] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [topPages, setTopPages] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [perfSummary, deviceData, trendData, userAnalytics, slowestPages] = await Promise.all([
        apiFetch(`/api/v1/dashboard/performance/summary?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/performance/device?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/performance/trends?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/customers/analytics?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/performance/slowest-pages?siteId=${projectId}`)
      ]);

      setWebVitals([
        { name: 'LCP', value: perfSummary?.lcp || 0, unit: 'ms', rating: (perfSummary?.lcp < 2500 ? 'good' : 'poor') as any, description: 'Largest Contentful Paint measures when the largest content element becomes visible.' },
        { name: 'FID', value: perfSummary?.fid || 0, unit: 'ms', rating: (perfSummary?.fid < 100 ? 'good' : 'poor') as any, description: 'First Input Delay measures responsiveness to user input.' },
        { name: 'CLS', value: perfSummary?.cls || 0, unit: '', rating: (perfSummary?.cls < 0.1 ? 'good' : 'poor') as any, description: 'Cumulative Layout Shift measures visual stability.' },
        { name: 'TTFB', value: perfSummary?.ttfb || 0, unit: 'ms', rating: (perfSummary?.ttfb < 600 ? 'good' : 'poor') as any, description: 'Time to First Byte measures server response time.' },
      ]);

      setDevices(Array.isArray(deviceData) ? deviceData : []);
      setLoadTimeTrend(Array.isArray(trendData) ? trendData : []);
      setAnalytics(userAnalytics);
      setTopPages(Array.isArray(slowestPages) ? slowestPages : []);
      setEvents([]); // Real events stream would go here
      
    } catch (err: any) {
      console.error('[RUM] Load failed', err);
      setError('Failed to synchronize frontend telemetry. Please check integration health.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, projectId, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-slate-800 animate-spin mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Frontend Telemetry…</span>
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
        <h2 className="text-xl font-bold text-white mb-2">Telemetry Desync</h2>
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

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" />
            Frontend Observability (RUM)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time user experience monitoring for {projectId}</p>
        </div>
        
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">{analytics?.activeUsers || 0} Active Sessions</span>
          </div>
          <button 
            onClick={loadData}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Core Web Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {webVitals.map((vital) => (
          <WebVitalCard key={vital.name} {...vital} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend */}
        <Card className="lg:col-span-2 p-6 bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Average Page Load Time (ms)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loadTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pageLoadTime" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Device Split */}
        <DeviceDistribution data={devices} title="Device Distribution" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Stream */}
        <div className="lg:col-span-1">
          <EventStream events={events} />
        </div>

        {/* Route Performance */}
        <Card className="lg:col-span-2 p-6 bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Route Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Path</th>
                  <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Avg Load</th>
                  <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {topPages.map((row) => (
                  <tr key={row.url} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 text-sm font-medium text-slate-300">{row.url}</td>
                    <td className="py-4 text-sm text-slate-400 text-right">{row.avgLoadTime}ms</td>
                    <td className="py-4 text-right">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        row.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                        row.status === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
