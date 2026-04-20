'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Users, 
  Box, 
  KeyRound, 
  History,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  Clock,
  RotateCcw
} from 'lucide-react';
import { 
  PageLayout, 
  Typography, 
  Card, 
  Badge, 
  Button,
  DiagnosticDrawer
} from '@kpi-platform/ui';
import { useAuth } from '../../../../context/AuthContext';
import { RoleGuard } from '../../../../components/auth/RoleGuard';

// Governance Components
import { GovernancePanel } from '../../../../components/administration/GovernancePanel';
import { IntegrationsConfig } from '../../../../components/administration/IntegrationsConfig';
import { RBACControl } from '../../../../components/administration/RBACControl';

export default function AdministrationPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { token, apiFetch } = useAuth();
  
  // Governance State
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('integrations');
  const [config, setConfig] = useState<any>(null);
  const [connectors, setConnectors] = useState<any[]>([]);

  // Safety State
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    try {
      const [govConfig, connData] = await Promise.all([
        apiFetch(`/api/v1/dashboard/governance?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/integrations/list?siteId=${projectId}`)
      ]);
      setConfig(govConfig);
      setConnectors(Array.isArray(connData) ? connData : []);
    } catch (err) {
      console.error('Governance fetch failure:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, token, apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActionRequest = (action: any) => {
    setPendingAction(action);
    setIsDrawerOpen(true);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <PageLayout
        title="Governance & System Control"
        subtitle="Manage the platform's central control plane: integrations, identity policies, and project environments."
        icon={<Settings size={24} />}
      >
         <div className="space-y-6 pb-24">
            {/* 1. Control Plane Navigation */}
            <GovernancePanel 
              activeTab={activeSection} 
              onTabChange={(id) => setActiveSection(id)} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               {/* 2. Focused Configuration Zone */}
               <div className="lg:col-span-3 space-y-8">
                  
                  {activeSection === 'integrations' && (
                    <IntegrationsConfig 
                      connectors={connectors}
                      loading={loading}
                      onAdd={() => handleActionRequest({ type: 'setup', title: 'New Connector Setup' })}
                    />
                  )}

                  {activeSection === 'rbac' && (
                    <RBACControl 
                      users={config?.rbac?.users || []}
                      roles={config?.rbac?.roles || []}
                      loading={loading}
                      onAddUser={() => handleActionRequest({ type: 'invite', title: 'Identity Invitation' })}
                    />
                  )}

                  {activeSection === 'projects' && (
                    <div className="space-y-6">
                       <Card className="p-8 border-subtle">
                          <div className="flex justify-between items-start mb-8">
                             <div>
                                <Typography variant="h3" weight="bold" noMargin>Project Metadata</Typography>
                                <Typography variant="micro" className="text-text-muted mt-1">Configuring regional residency and environment mapping.</Typography>
                             </div>
                             <Badge variant="success" size="sm">ACTIVE SCOPE</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <Typography variant="micro" weight="bold" className="text-text-muted uppercase">ENVIRONMENT TYPE</Typography>
                                <Typography variant="body" weight="bold" className="text-sm border-b border-subtle pb-2 block">Enterprise Production</Typography>
                             </div>
                             <div className="space-y-2">
                                <Typography variant="micro" weight="bold" className="text-text-muted uppercase">DATA RESIDENCY</Typography>
                                <Typography variant="body" weight="bold" className="text-sm border-b border-subtle pb-2 block">{config?.project?.region}</Typography>
                             </div>
                          </div>
                       </Card>
                       <Card className="p-8 border-subtle bg-muted/20">
                          <Typography variant="h3" weight="bold" className="mb-4">Environmental Guardrails</Typography>
                          <div className="space-y-4">
                             {config?.project?.environments.map((env: string) => (
                                <div key={env} className="flex items-center justify-between p-3 bg-surface border border-subtle rounded-xl group hover:border-primary/30 transition-all cursor-pointer">
                                   <div className="flex items-center gap-3">
                                      <Box className="text-text-muted transition-colors group-hover:text-primary" size={18} />
                                      <Typography variant="body" weight="bold" className="text-sm capitalize">{env}</Typography>
                                   </div>
                                   <Badge variant={env === 'production' ? 'success' : 'default'} size="sm">ISOLATED</Badge>
                                </div>
                             ))}
                          </div>
                       </Card>
                    </div>
                  )}

                  {['api', 'alerts', 'preferences'].includes(activeSection) && (
                    <Card className="p-12 border-dashed border-subtle flex flex-col items-center text-center">
                       <div className="p-4 rounded-full bg-muted text-text-muted mb-4">
                          <Lock size={32} />
                       </div>
                       <Typography variant="h3" weight="bold">Module under Governance</Typography>
                       <Typography variant="body" className="text-text-muted mt-2 max-w-sm">
                          This configuration section is currently locked following the {config?.versioning?.currentVersion} security hardening policy. 
                          Contact your Security Lead for override access.
                       </Typography>
                       <button type="button" className="mt-6 text-primary font-bold hover:underline flex items-center gap-1 text-sm">
                           Request Temporary Escalation <ChevronRight size={14} />
                        </button>
                    </Card>
                  )}
               </div>

               {/* 3. Governance Signals & History */}
               <div className="space-y-6">
                  <Card className="p-6 border-subtle">
                     <div className="flex items-center gap-2 mb-6 text-text-muted">
                        <History size={18} />
                        <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider">
                           Configuration History
                        </Typography>
                     </div>
                     <div className="space-y-6 relative border-l border-subtle ml-2 pl-6">
                        <div className="relative">
                           <div className="absolute left-[-31px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                           <Typography variant="body" weight="bold" className="text-xs">Current Version</Typography>
                           <Typography variant="body" weight="bold" className="text-[10px] text-primary">{config?.versioning?.currentVersion}</Typography>
                           <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-subtle">
                              <Typography variant="micro" weight="bold" className="block text-text-primary">
                                 {config?.versioning?.lastChange?.change}
                              </Typography>
                              <div className="flex items-center gap-2 mt-2">
                                 <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">J</div>
                                 <Typography variant="micro" className="text-text-muted">{config?.versioning?.lastChange?.who} • {config?.versioning?.lastChange?.timestamp}</Typography>
                              </div>
                           </div>
                        </div>
                        <div className="relative opacity-60">
                           <div className="absolute left-[-31px] top-1 w-2.5 h-2.5 rounded-full bg-surface border-2 border-subtle" />
                           <Typography variant="body" weight="bold" className="text-xs">v2.4.0</Typography>
                           <Typography variant="micro" className="text-text-muted block mt-1">
                              Major environment mapping update for Q2.
                           </Typography>
                        </div>
                     </div>
                      <button type="button" className="action-btn action-btn--ghost action-btn--wide" style={{ marginTop: '2rem', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                         <RotateCcw size={12} /> Rollback Plane
                      </button>
                  </Card>

                  <Card className="p-6 border-subtle bg-primary/5 border-primary/20">
                     <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                           <ShieldCheck size={20} />
                        </div>
                        <div>
                           <Typography variant="body" weight="bold" className="text-sm">Compliance Active</Typography>
                           <Typography variant="micro" className="text-text-muted mt-1 block leading-relaxed">
                              This environment is currently governed by **ISO-27001** and **SOC2** security policies.
                           </Typography>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
         </div>

         {/* Governance Action Safety Drawer */}
         <DiagnosticDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title={pendingAction?.title || 'Governance Confirmation'}
            subtitle={`Action Request: ${pendingAction?.type.toUpperCase()} • System Scope: ${projectId}`}
            width="600px"
         >
            {pendingAction && (
              <div className="space-y-8">
                 <div className="p-6 bg-warning/5 border border-warning/20 rounded-3xl flex gap-4">
                    <div className="shrink-0 p-3 bg-warning/10 text-warning rounded-2xl h-fit">
                       <AlertCircle size={24} />
                    </div>
                    <div>
                        <Typography variant="body" weight="bold" className="text-base text-warning-text">Privileged Action Required</Typography>
                       <Typography variant="body" className="text-sm mt-1 text-text-secondary leading-relaxed">
                          You are about to perform a configuration update that affects the stability and visibility of the **{projectId}** environment.
                       </Typography>
                    </div>
                 </div>

                 <section className="space-y-4">
                    <Typography variant="body" weight="bold" className="text-sm text-text-muted uppercase tracking-wider">Review Change Scope</Typography>
                    <div className="p-4 bg-muted/20 border border-subtle rounded-2xl space-y-3">
                       <div className="flex justify-between">
                          <Typography variant="body" className="text-sm">Actor</Typography>
                          <Typography variant="body" weight="bold" className="text-sm">System Admin</Typography>
                       </div>
                       <div className="flex justify-between">
                          <Typography variant="body" className="text-sm">Region Impact</Typography>
                          <Typography variant="body" weight="bold" className="text-sm">Global (Multi-Environment)</Typography>
                       </div>
                       <div className="flex justify-between">
                          <Typography variant="body" className="text-sm">Audit Persistence</Typography>
                          <Typography variant="body" weight="bold" className="text-sm text-success">Immutable Log (365d)</Typography>
                       </div>
                    </div>
                 </section>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-text-muted p-1">
                       <Info size={14} />
                       <Typography variant="micro" weight="bold">Confirmation will create a new configuration version.</Typography>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" className="action-btn action-btn--primary" style={{ flex: 1, padding: '1rem' }}>
                           <CheckCircle2 size={18} />
                           Confirm Governance Action
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsDrawerOpen(false)}
                          className="action-btn action-btn--outline" style={{ flex: 1, padding: '1rem' }}
                        >
                           Cancel
                        </button>
                    </div>
                 </div>
              </div>
            )}
         </DiagnosticDrawer>
      </PageLayout>
    </RoleGuard>
  );
}
