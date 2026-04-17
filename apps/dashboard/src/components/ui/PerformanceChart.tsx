'use client';
import React, { memo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ChartPoint {
    timestamp: string;
    pageLoadTime: number;
    ttfb: number;
    fcp: number;
    lcp: number;
}

interface PerformanceChartProps {
    data: ChartPoint[];
    title: string;
}

export const PerformanceChart = memo(({ data, title }: PerformanceChartProps) => {
    if (!data || data.length === 0) return null;

    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
            marginBottom: '32px'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {title}
            </h3>
            
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis 
                            dataKey="timestamp" 
                            stroke="var(--text-secondary)" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="var(--text-secondary)" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `${value}ms`}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--bg-surface)', 
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend iconType="circle" />
                        <Line 
                            type="monotone" 
                            dataKey="pageLoadTime" 
                            name="Page Load" 
                            stroke="var(--accent-blue)" 
                            strokeWidth={3} 
                            dot={data.length > 30 ? false : { r: 4 }} 
                            activeDot={data.length > 100 ? false : { r: 6 }} 
                            isAnimationActive={data.length < 50}
                        />
                        <Line type="monotone" dataKey="lcp" name="LCP" stroke="var(--accent-orange)" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={data.length < 50} />
                        <Line type="monotone" dataKey="fcp" name="FCP" stroke="var(--accent-green)" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={data.length < 50} />
                        <Line type="monotone" dataKey="ttfb" name="TTFB" stroke="var(--accent-red)" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={data.length < 50} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}, (prev, next) => {
    // Only re-render if the title changes or the actual underlying data payload length updates.
    return prev.title === next.title && prev.data?.length === next.data?.length;
});
