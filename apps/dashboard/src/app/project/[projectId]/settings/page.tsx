import { 
  Settings, 
  Shield, 
  Database, 
  Key, 
  RefreshCcw, 
  Trash2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    return (
        <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
                <header style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Project Settings</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Advanced configuration and connector governance for {projectId}</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                    
                    {/* General Monitoring Thresholds */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <Settings size={20} color="var(--accent-blue)" />
                            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Monitoring Thresholds</h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { label: 'LCP Critical Threshold (ms)', value: 4000, color: 'var(--accent-red)' },
                                { label: 'Error Rate Warning (%)', value: 5, color: 'var(--accent-orange)' },
                                { label: 'OMS Sync Timeout (secs)', value: 300, color: 'var(--accent-blue)' }
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{item.label}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Triggers site-wide {item.color.includes('red') ? 'Critical' : 'Warning'} alerts</div>
                                    </div>
                                    <input type="number" defaultValue={item.value} style={{ 
                                        padding: '10px 16px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '10px',
                                        color: 'var(--text-primary)', width: '120px', textAlign: 'right', fontWeight: '800'
                                    }} />
                                </div>
                            ))}
                        </div>
                        <button style={{ marginTop: '32px', padding: '12px 32px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                            Save Thresholds
                        </button>
                    </div>

                    {/* Connector Governance */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Database size={20} color="var(--accent-green)" />
                            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>External Connectors</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>Manage 3rd party ERP/OMS connectivity and sync schedules.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { name: 'SAP Commerce Sync', type: 'REST Poller', interval: '5m', status: 'Active' },
                                { name: 'Shopify Webhooks', type: 'Incoming', interval: 'Real-time', status: 'Active' },
                                { name: 'Legacy WMS (CSV)', type: 'File Import', interval: 'Manual', status: 'Inactive' }
                            ].map(conn => (
                                <div key={conn.name} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Shield size={20} color="var(--text-secondary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '800' }}>{conn.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{conn.type} · {conn.interval}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: conn.status === 'Active' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                                            <CheckCircle2 size={12} /> {conn.status}
                                        </div>
                                        <button style={{ padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                                            <ExternalLink size={14} color="var(--text-secondary)" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* API and Access Control */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Key size={20} color="var(--accent-purple)" />
                            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>API Tokens</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Public and Private keys for headless data ingestion.</p>
                        
                        <div style={{ padding: '16px', background: 'var(--bg-app)', border: '1px dashed var(--border)', borderRadius: '12px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>PUBLIC SITE KEY</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <code style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: '700' }}>pub_live_51M...33x{projectId.slice(-4)}</code>
                                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                    <RefreshCcw size={12} /> Rotate
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Trash2 size={20} color="var(--accent-red)" />
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-red)' }}>Danger Zone</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>Permanent operations including project archival or deletion.</p>
                        
                        <button style={{ padding: '12px 32px', background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                            Archive Project
                        </button>
                    </div>

                </div>
            </div>
        </RoleGuard>
    );
}
