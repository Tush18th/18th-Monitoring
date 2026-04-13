import { useParams } from 'next/navigation';
import { RoleGuard } from '../../../../components/auth/RoleGuard';

export default function SettingsPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    return (
        <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="animate-fade-in">
            <header style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Project Settings</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Configuration and threshold management for {projectId}</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Monitoring Thresholds</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Define triggers for high-severity alerts</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {[
                            { label: 'Page Load Critical (ms)', value: 3000 },
                            { label: 'Error Rate Warning (%)', value: 5 },
                            { label: 'Sync Timeout (secs)', value: 120 }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
                                <input type="number" defaultValue={item.value} style={{ 
                                    padding: '8px 12px', background: 'var(--border-light)', border: '1px solid var(--border)', borderRadius: '8px',
                                    color: 'var(--text-primary)', width: '100px', textAlign: 'right', fontWeight: '700'
                                }} />
                            </div>
                        ))}
                    </div>

                    <button style={{ marginTop: '32px', padding: '12px 24px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                        Save Changes
                    </button>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '16px', padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-red)', marginBottom: '8px' }}>Danger Zone</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Destructive operations for this project</p>
                    
                    <button style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                        Delete Project
                    </button>
                </div>
            </div>
        </div>
        </RoleGuard>
    );
}
