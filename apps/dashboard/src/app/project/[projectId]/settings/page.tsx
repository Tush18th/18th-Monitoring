'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { RoleGuard } from '../../../../components/auth/RoleGuard';
import { IntegrationCatalog } from '../../../../components/ui/IntegrationCatalog';
import { AccessControlTab } from '../../../../components/ui/AccessControlTab';
import { 
  Settings, 
  Shield, 
  Key, 
  RefreshCcw, 
  Trash2,
  Sliders,
  Database,
  Info
} from 'lucide-react';
import { PageLayout } from '@kpi-platform/ui';
import { FormSection, FormGroup, FormLabel, FormHelper, FormInput } from '../../../../components/ui/FormPrimitives';

export default function SettingsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { apiFetch } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'access'>('general');

    return (
        <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <PageLayout
                title="Project Governance & Configuration"
                subtitle={`Master control center for security policies, third-party connectors, and system-wide SLAs for ${projectId}`}
            >
                <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>

                <div style={{ display: 'flex', gap: '32px', marginBottom: '40px', borderBottom: '1px solid var(--border)' }}>
                    {[
                        { id: 'general', label: 'General & Thresholds', icon: <Sliders size={16} /> },
                        { id: 'integrations', label: 'Connections & Integrations', icon: <Database size={16} /> },
                        { id: 'access', label: 'Access Control', icon: <Key size={16} /> }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 4px',
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                transition: 'all 0.2s',
                                position: 'relative',
                                top: '1px'
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ minHeight: '600px' }}>
                    {activeTab === 'general' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                             <FormSection 
                                title="Baseline Monitoring Thresholds" 
                                description="Configure core thresholds that govern alerting logic globally."
                                icon={<Settings size={20} color="var(--accent-blue)" />}
                             >
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                    <FormGroup>
                                        <FormLabel required>Project-Level Rate Limit Ceiling (RPM)</FormLabel>
                                        <FormHelper error={true}>Value must be greater than 1000 RPM.</FormHelper>
                                        <FormInput type="number" defaultValue={5000} error={true} />
                                    </FormGroup>

                                    <FormGroup>
                                        <FormLabel>LCP Critical Threshold (ms)</FormLabel>
                                        <FormHelper>The maximum allowed baseline loading state before a global alert triggers.</FormHelper>
                                        <FormInput type="number" defaultValue={4000} rightElement={<span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '800' }}>ms</span>} />
                                    </FormGroup>
                                    
                                    <FormGroup>
                                        <FormLabel>Sync Timeout SLA (secs)</FormLabel>
                                        <FormHelper>Maximum duration an integration thread can hang before it drops.</FormHelper>
                                        <FormInput type="number" defaultValue={300} rightElement={<span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '800' }}>s</span>} />
                                    </FormGroup>
                                </div>
                                
                                <div style={infoBanner}>
                                    <Info size={16} />
                                    <span>Global ceilings act as a secondary hard-block for standard keys, while VIP-tagged tokens may bypass these thresholds.</span>
                                </div>

                                <div>
                                    <button className="btn-core" style={primaryBtnStyle}>Commit Calibration</button>
                                </div>
                            </FormSection>

                            <FormSection
                                dangerouslyRed={true}
                                title="Security Deprecation"
                                description="Permanent actions that impact project scope, data retention, or connector legacy mapping in an irreversible way."
                                icon={<Trash2 size={20} color="var(--accent-red)" />}
                            >
                                <div>
                                    <button className="btn-core" style={dangerBtnStyle}>Archive Managed Scope</button>
                                </div>
                            </FormSection>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div>
                            <IntegrationCatalog projectId={projectId} apiFetch={apiFetch} />
                        </div>
                    )}

                    {activeTab === 'access' && (
                        <div>
                            <AccessControlTab projectId={projectId} apiFetch={apiFetch} />
                        </div>
                    )}
                </div>
                </div>
            </PageLayout>
        </RoleGuard>
    );
}

const sectionStyle: React.CSSProperties = {
    background: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-sm)'
};

const infoBanner: React.CSSProperties = {
    padding: '16px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px',
    display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4'
};

const primaryBtnStyle: React.CSSProperties = {
    padding: '12px 32px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
};

const dangerBtnStyle: React.CSSProperties = {
    padding: '12px 32px', background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', borderRadius: '12px', fontWeight: '800', cursor: 'pointer'
};
