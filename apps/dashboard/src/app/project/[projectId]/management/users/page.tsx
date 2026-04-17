'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../../context/AuthContext';
import { RoleGuard } from '../../../../../components/auth/RoleGuard';
import { PageLayout } from '@kpi-platform/ui';
import { MonitoringFilterBar } from '../../../../../components/ui/MonitoringFilterBar';
import { SectionHeader } from '../../../../../components/ui/SectionHeader';
import { SortableTable } from '../../../../../components/ui/SortableTable';

export default function UserManagementPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { apiFetch, user } = useAuth();
    
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password123', role: 'CUSTOMER' });
    const [isSaving, setIsSaving] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/api/v1/admin/projects/${projectId}/users`);
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [projectId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiFetch(`/api/v1/admin/projects/${projectId}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            setShowModal(false);
            setNewUser({ name: '', email: '', password: 'password123', role: 'CUSTOMER' });
            loadUsers();
        } catch (e: any) {
            alert(e.message || 'Failed to create system user');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (uid: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await apiFetch(`/api/v1/admin/users/${uid}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadUsers();
        } catch (e: any) {
            alert(e.message || 'Failed to update user status');
        }
    };

    if (loading && users.length === 0) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading system users...</div>;

    return (
        <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <PageLayout 
                title="System User Management"
                subtitle={`Manage platform access for ${projectId}`}
                actions={
                    <button 
                        onClick={() => setShowModal(true)}
                        style={{
                            padding: '10px 20px', borderRadius: '12px', background: 'var(--accent-blue)',
                            color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer',
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)'
                        }}
                    >
                        + Invite Platform User
                    </button>
                }
            >
                <div className="animate-fade-in" style={{ position: 'relative', paddingBottom: '40px' }}>
                    <MonitoringFilterBar />

                <SectionHeader title="Access Roster" subtitle="Manage administrators, managers, and viewers" icon="🛡️" />
                <SortableTable
                    columns={[
                        { 
                            key: 'name', 
                            label: 'Platform User', 
                            sortable: true, 
                            render: (v, row) => (
                                <div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.email}</div>
                                </div>
                            )
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            sortable: true,
                            render: (v) => (
                                <span style={{
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                    background: v === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: v === 'active' ? '#22c55e' : '#ef4444',
                                    textTransform: 'uppercase'
                                }}>
                                    {v}
                                </span>
                            )
                        },
                        {
                            key: 'createdAt',
                            label: 'Joined',
                            sortable: true,
                            render: (v, row) => row.audit?.createdAt ? new Date(row.audit.createdAt).toLocaleDateString() : '—'
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            align: 'right',
                            render: (v, row) => (
                                <button 
                                    onClick={() => toggleStatus(row.email, row.status)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                                        background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px',
                                        fontWeight: '700', cursor: 'pointer'
                                    }}
                                >
                                    {row.status === 'active' ? 'Deactivate' : 'Reactivate'}
                                </button>
                            )
                        }
                    ]}
                    data={users}
                    emptyMessage="No system users found for this project."
                />

                {/* Create Customer Modal */}
                {showModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: 'var(--bg-surface)', width: '480px', borderRadius: '24px',
                            padding: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)'
                        }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Invite Platform Contributor</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                This user will be granted access to project: <strong>{projectId}</strong>.
                            </p>

                            <form onSubmit={handleCreate}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={newUser.name}
                                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--border-light)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Email Address</label>
                                    <input 
                                        required
                                        type="email" 
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--border-light)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Initial Password</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--border-light)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Users will be prompted to change this on first login.</span>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-blue)', color: '#fff', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                                    >
                                        {isSaving ? 'Saving...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                </div>
            </PageLayout>
        </RoleGuard>
    );
}
