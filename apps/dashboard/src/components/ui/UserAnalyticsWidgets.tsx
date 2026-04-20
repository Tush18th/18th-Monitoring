'use client';
import React from 'react';

export interface DistributionItem {
    name: string;
    count: number;
    percentage: number;
}

/**
 * The shape the API (`getUserAnalytics`) actually returns for deviceBreakdown.
 * It is a keyed object – NOT an array.
 */
export interface DeviceBreakdown {
    desktop: { count: number; percentage: number };
    mobile:  { count: number; percentage: number };
    tablet:  { count: number; percentage: number };
}

/**
 * Flattened entry used by lists / tables that need an array of devices.
 */
export interface DeviceBreakdownArrayItem {
    device: string;
    count: number;
    percentage: number;
}

export interface UserAnalyticsData {
    activeUsers: number;
    totalCustomers: number;
    activeVisitors: number;
    deviceBreakdown: DeviceBreakdown;
    browserBreakdown: DistributionItem[];
}

/**
 * Normalizes the API-returned deviceBreakdown object into a flat array
 * suitable for table/list rendering.
 *
 * Handles all edge cases:
 *  - null / undefined  → returns []
 *  - array already     → returns it unchanged (defensive forward-compat)
 *  - valid object      → converts to [{device, count, percentage}, ...]
 *  - malformed object  → returns []
 */
export function normalizeDeviceBreakdownToArray(
    breakdown: DeviceBreakdown | DeviceBreakdownArrayItem[] | null | undefined
): DeviceBreakdownArrayItem[] {
    if (!breakdown) return [];

    // If backend ever changes to return an array, pass it through safely.
    if (Array.isArray(breakdown)) {
        return breakdown.filter(
            (item): item is DeviceBreakdownArrayItem =>
                item != null &&
                typeof item.device === 'string' &&
                typeof item.count === 'number'
        );
    }

    // Object shape – the current API contract.
    if (typeof breakdown === 'object') {
        const DEVICE_META: Record<string, { label: string }> = {
            desktop: { label: 'Desktop' },
            mobile:  { label: 'Mobile'  },
            tablet:  { label: 'Tablet'  },
        };

        return Object.entries(DEVICE_META)
            .map(([key, meta]) => {
                const entry = (breakdown as DeviceBreakdown)[key as keyof DeviceBreakdown];
                if (!entry || typeof entry.count !== 'number') return null;
                return {
                    device:     meta.label,
                    count:      entry.count,
                    percentage: entry.percentage ?? 0,
                };
            })
            .filter((item): item is DeviceBreakdownArrayItem => item !== null);
    }

    if (process.env.NODE_ENV !== 'production') {
        console.warn('[normalizeDeviceBreakdownToArray] Unexpected deviceBreakdown shape:', breakdown);
    }
    return [];
}

export const UserStatsSummary = ({ data }: { data: UserAnalyticsData }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={cardStyle}>
                <span style={cardLabelStyle}>Active Users</span>
                <div style={cardValueRowStyle}>
                    <span style={cardValueStyle}>{data.activeUsers}</span>
                    <span style={cardIconStyle}>👥</span>
                </div>
                <div style={cardSubtextStyle}>Active in last 5 minutes</div>
            </div>
            <div style={cardStyle}>
                <span style={cardLabelStyle}>Total Customers</span>
                <div style={cardValueRowStyle}>
                    <span style={cardValueStyle}>{data.totalCustomers}</span>
                    <span style={cardIconStyle}>👤</span>
                </div>
                <div style={cardSubtextStyle}>Logged-in active users</div>
            </div>
            <div style={cardStyle}>
                <span style={cardLabelStyle}>Anonymous Visitors</span>
                <div style={cardValueRowStyle}>
                    <span style={cardValueStyle}>{data.activeVisitors}</span>
                    <span style={cardIconStyle}>🌐</span>
                </div>
                <div style={cardSubtextStyle}>Unauthenticated active users</div>
            </div>
        </div>
    );
};

export const DeviceDistribution = ({ data }: { data: DeviceBreakdown | null | undefined }) => {
    // Guard: API returns an object, not an array. Spread each keyed entry safely.
    const safeData: DeviceBreakdown = (data && typeof data === 'object' && !Array.isArray(data))
        ? data
        : { desktop: { count: 0, percentage: 0 }, mobile: { count: 0, percentage: 0 }, tablet: { count: 0, percentage: 0 } };

    const devices = [
        { name: 'Desktop', ...safeData.desktop, icon: '💻', color: 'var(--accent-blue)'   },
        { name: 'Mobile',  ...safeData.mobile,  icon: '📱', color: 'var(--accent-purple)' },
        { name: 'Tablet',  ...safeData.tablet,  icon: '🪙', color: 'var(--accent-green)'  },
    ];

    const hasData = devices.some(d => d.count > 0);

    return (
        <div style={{ ...sectionStyle, flex: 1 }}>
            <h3 style={sectionTitleStyle}>Device Distribution</h3>
            {hasData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {devices.map(device => (
                        <div key={device.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>{device.icon}</span>
                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{device.name}</span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    {device.count} <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>({device.percentage}%)</span>
                                </span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${device.percentage}%`,
                                    background: device.color,
                                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '16px 0' }}>
                    No device data available for this period.
                </div>
            )}
        </div>
    );
};

export const BrowserDistribution = ({ data }: { data: DistributionItem[] | null | undefined }) => {
    const safeData: DistributionItem[] = Array.isArray(data) ? data : [];

    return (
        <div style={{ ...sectionStyle, flex: 1.5 }}>
            <h3 style={sectionTitleStyle}>Browser Distribution</h3>
            {safeData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {safeData.map((browser, i) => (
                        <div key={browser.name} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: i % 2 === 0 ? 'var(--bg-main)' : 'transparent',
                            borderRadius: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    fontWeight: '800',
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase'
                                }}>
                                    {browser.name?.[0] ?? '?'}
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>{browser.name}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '800', fontSize: '14px' }}>{browser.count} users</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{browser.percentage}% of traffic</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '16px 0' }}>
                    No browser data available for this period.
                </div>
            )}
        </div>
    );
};

// --- Styles ---

const cardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default'
};

const cardLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const cardValueRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '12px 0'
};

const cardValueStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: '900',
    color: 'var(--text-primary)'
};

const cardIconStyle: React.CSSProperties = {
    fontSize: '28px'
};

const cardSubtextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--text-secondary)'
};

const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: 'var(--shadow-sm)'
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '800',
    marginBottom: '24px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-secondary)'
};
