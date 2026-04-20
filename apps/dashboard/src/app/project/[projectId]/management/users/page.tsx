'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Input, PageLayout, Typography } from '@kpi-platform/ui';
import { Plus, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import { RoleGuard } from '../../../../../components/auth/RoleGuard';
import { MonitoringFilterBar } from '../../../../../components/ui/MonitoringFilterBar';
import { SectionHeader } from '../../../../../components/ui/SectionHeader';
import { SortableTable } from '../../../../../components/ui/SortableTable';

export default function UserManagementPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { apiFetch } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password123', role: 'CUSTOMER' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/admin/projects/${projectId}/users`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [projectId]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await apiFetch(`/api/v1/admin/projects/${projectId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      setShowModal(false);
      setNewUser({ name: '', email: '', password: 'password123', role: 'CUSTOMER' });
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to create user');
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
        body: JSON.stringify({ status: newStatus }),
      });
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to update user status');
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <PageLayout
        title="User Management"
        subtitle={`Manage project access, permissions, and account status for ${projectId}.`}
        actions={
          <Button leftIcon={Plus} onClick={() => setShowModal(true)}>
            Invite user
          </Button>
        }
      >
        <div className="dashboard-page-body" style={{ position: 'relative' }}>
          <MonitoringFilterBar />

          <SectionHeader
            title="Access roster"
            subtitle="Administrators, managers, and customer users are managed from one consistent access table."
            icon={<ShieldCheck size={16} />}
          />

          <SortableTable
            loading={loading}
            data={users}
            emptyMessage="No users have been added to this project yet."
            columns={[
              {
                key: 'name',
                label: 'User',
                sortable: true,
                render: (_value, row) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.email}</div>
                  </div>
                ),
              },
              {
                key: 'role',
                label: 'Role',
                sortable: true,
                render: (value) => <span className="dashboard-inline-status">{String(value).replace('_', ' ')}</span>,
              },
              {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (value) => (
                  <span className={`dashboard-inline-status ${value === 'active' ? 'is-success' : 'is-danger'}`}>
                    {value}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Joined',
                sortable: true,
                render: (_value, row) => (row.audit?.createdAt ? new Date(row.audit.createdAt).toLocaleDateString() : '--'),
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (_value, row) => (
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(row.email, row.status)}>
                    {row.status === 'active' ? 'Deactivate' : 'Reactivate'}
                  </Button>
                ),
              },
            ]}
          />

          {showModal ? (
            <div className="dashboard-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-user-title">
              <div className="dashboard-modal-card">
                <div className="dashboard-stack" style={{ gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                    <div>
                      <Typography variant="h2" noMargin id="invite-user-title">
                        Invite project user
                      </Typography>
                      <Typography variant="body" color="secondary">
                        Add a new workspace user for {projectId}. They will be prompted to update their password after first login.
                      </Typography>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} aria-label="Close dialog">
                      <X size={18} />
                    </Button>
                  </div>

                  <form onSubmit={handleCreate} className="dashboard-stack" style={{ gap: '1rem' }}>
                    <Input
                      label="Full name"
                      value={newUser.name}
                      onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                      required
                    />
                    <Input
                      label="Email address"
                      type="email"
                      value={newUser.email}
                      onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                      required
                    />
                    <Input
                      label="Temporary password"
                      value={newUser.password}
                      onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                      helperText="Users will be prompted to change this password after sign-in."
                      required
                    />

                    <div className="dashboard-action-row" style={{ justifyContent: 'flex-end' }}>
                      <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={isSaving} leftIcon={UserPlus}>
                        Create account
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </PageLayout>
    </RoleGuard>
  );
}
