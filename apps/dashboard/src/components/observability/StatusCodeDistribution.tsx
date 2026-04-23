import React from 'react';
import { Card } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StatusData {
  name: string;
  value: number;
}

interface StatusCodeDistributionProps {
  data: StatusData[];
}

const COLORS = {
  '2xx': '#10b981',
  '3xx': '#6366f1',
  '4xx': '#f59e0b',
  '5xx': '#ef4444',
};

export const StatusCodeDistribution: React.FC<StatusCodeDistributionProps> = ({ data }) => {
  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-xl border-slate-800 h-full">
      <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Status Code Distribution</h3>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={(COLORS as any)[entry.name] || '#64748b'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
