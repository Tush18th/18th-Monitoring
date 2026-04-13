'use client';
import React from 'react';

interface ChartPoint {
    timestamp: string;
    success: number;
    failure: number;
}

interface SyncTrendChartProps {
    data: ChartPoint[];
    title: string;
}

export const SyncTrendChart = ({ data, title }: SyncTrendChartProps) => {
    if (!data || data.length === 0) return null;

    const width = 800;
    const height = 200;
    const padding = 20;

    const maxVal = Math.max(...data.map(d => Math.max(d.success, d.failure, 10)));
    
    const getX = (index: number) => (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const getY = (value: number) => height - ((value / maxVal) * (height - 2 * padding) + padding);

    const createPath = (key: 'success' | 'failure') => {
        return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] as number)}`).join(' ');
    };

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
            <div style={{ position: 'relative', height: `${height}px`, width: '100%' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(v => (
                        <line 
                            key={v}
                            x1={padding} y1={getY(v * maxVal)} 
                            x2={width - padding} y2={getY(v * maxVal)} 
                            stroke="var(--border-light)" 
                            strokeWidth="1" 
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Paths */}
                    <path d={createPath('success')} fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={createPath('failure')} fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeDasharray="5 5" />

                    {/* X-Axis Labels */}
                    {data.map((d, i) => (
                        <text key={i} x={getX(i)} y={height + 15} textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--text-secondary)', fontWeight: '600' }}>
                            {d.timestamp}
                        </text>
                    ))}
                </svg>
            </div>
            
            {/* Legend */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '30px', justifyContent: 'center' }}>
                {[
                    { label: 'Successful Syncs', color: 'var(--accent-green)' },
                    { label: 'Failed Syncs', color: 'var(--accent-red)' },
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '3px', background: item.color, borderRadius: '2px' }} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
