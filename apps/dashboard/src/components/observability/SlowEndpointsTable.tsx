import React from 'react';
import { Card } from '../ui/Card';
import { AlertCircle, Clock } from 'lucide-react';

interface EndpointMetric {
  route: string;
  method: string;
  p95: number;
  p99: number;
  errorRate: number;
  calls: number;
}

interface SlowEndpointsTableProps {
  endpoints: EndpointMetric[];
}

export const SlowEndpointsTable: React.FC<SlowEndpointsTableProps> = ({ endpoints }) => {
  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Top Slow Endpoints</h3>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Last 60 Minutes
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="pb-3">METHOD</th>
              <th className="pb-3">ROUTE</th>
              <th className="pb-3 text-right">P95</th>
              <th className="pb-3 text-right">P99</th>
              <th className="pb-3 text-right">ERR %</th>
              <th className="pb-3 text-right">CALLS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {endpoints.map((item, idx) => (
              <tr key={idx} className="group hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                    item.method === 'POST' ? 'bg-indigo-500/10 text-indigo-400' :
                    item.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {item.method}
                  </span>
                </td>
                <td className="py-3 text-xs font-mono text-slate-300 truncate max-w-[200px]">
                  {item.route}
                </td>
                <td className="py-3 text-xs text-right font-medium text-slate-300">
                  {item.p95}ms
                </td>
                <td className={`py-3 text-xs text-right font-bold ${item.p99 > 1000 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {item.p99}ms
                </td>
                <td className={`py-3 text-xs text-right font-medium ${item.errorRate > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {item.errorRate}%
                </td>
                <td className="py-3 text-xs text-right text-slate-500">
                  {item.calls.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
