'use client';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input, Typography } from '@kpi-platform/ui';
import { ArrowRight, Lock, Mail, ShieldCheck, Activity, Layers3 } from 'lucide-react';
import { LoginFooter } from '../../components/auth/LoginFooter';
import { DemoRoleSelector } from '../../components/auth/DemoRoleSelector';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'clamp(1rem, 4vw, 2.5rem)' }}>
        <div className="dashboard-hero-grid" style={{ width: 'min(1200px, 100%)' }}>
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '1.5rem',
              padding: 'clamp(1rem, 2vw, 2rem)',
            }}
          >
            <span className="dashboard-inline-status is-success" style={{ width: 'fit-content' }}>
              <span className="dashboard-live-dot" />
              Production-ready observability workspace
            </span>
            <div className="dashboard-stack" style={{ gap: '0.9rem' }}>
              <Typography variant="h1" noMargin>
                Monitor performance, commerce flow, and platform health from one workspace.
              </Typography>
              <Typography variant="body" color="secondary">
                A unified enterprise dashboard for telemetry, integrations, alerting, and project governance.
              </Typography>
            </div>

            <div className="dashboard-card-grid">
              {[
                { title: 'Operational visibility', copy: 'Live KPIs, latency, outages, and issue triage.', icon: <Activity size={18} /> },
                { title: 'Scoped access', copy: 'Role-aware project navigation and secure management flows.', icon: <ShieldCheck size={18} /> },
                { title: 'Consistent workflows', copy: 'Aligned views for monitoring, settings, orders, and integrations.', icon: <Layers3 size={18} /> },
              ].map((item) => (
                <Card key={item.title} padding="md" className="is-hoverable">
                  <div className="dashboard-stack" style={{ gap: '0.85rem' }}>
                    <div className="dashboard-inline-status" style={{ width: 'fit-content' }}>
                      {item.icon}
                    </div>
                    <Typography variant="h3" noMargin>
                      {item.title}
                    </Typography>
                    <Typography variant="body" color="secondary">
                      {item.copy}
                    </Typography>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Card
            padding="lg"
            title="Sign in"
            description="Use your workspace credentials or choose a demo profile to explore the platform."
            className="auth-card-shadow"
          >
            <form onSubmit={handleSubmit} className="dashboard-stack" style={{ gap: '1rem' }}>
              <Input
                label="Work email"
                type="email"
                placeholder="j.doe@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                icon={Mail}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                icon={Lock}
                required
              />

              {error ? (
                <div className="dashboard-inline-status is-danger" role="alert" style={{ justifyContent: 'flex-start', borderRadius: '18px' }}>
                  <span className="dashboard-live-dot" />
                  {error}
                </div>
              ) : null}

              <Button type="submit" size="lg" isLoading={isLoading} rightIcon={ArrowRight}>
                Enter workspace
              </Button>
            </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <DemoRoleSelector
                onSelect={(selectedEmail) => {
                  setEmail(selectedEmail);
                  setPassword('password123');
                }}
              />
            </div>
          </Card>
        </div>
      </main>
      <LoginFooter />
    </div>
  );
}
