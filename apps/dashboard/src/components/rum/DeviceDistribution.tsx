import React from 'react';
import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DeviceData {
  name: string;
  value: number;
}

interface DeviceDistributionProps {
  data: DeviceData[];
  title: string;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'];

export const DeviceDistribution: React.FC<DeviceDistributionProps> = ({ data, title }) => {
  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-xl border-slate-800 h-full">
      <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">{title}</h3>
      
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-slate-300">{item.name}</span>
            </div>
            <span className="font-medium text-slate-100">{item.value}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
