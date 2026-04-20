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
      <main className="flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          <div className="dashboard-hero-grid">
            <section className="flex flex-col justify-center gap-6 py-4 sm:py-8 px-2 sm:px-0">
              <span className="dashboard-inline-status is-success w-fit">
                <span className="dashboard-live-dot" />
                Production-ready observability workspace
              </span>
              <div className="dashboard-stack gap-4">
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
                  <Card key={item.title} padding="md" isHoverable>
                    <div className="dashboard-stack gap-3">
                      <div className="dashboard-inline-status w-fit">
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
              <form onSubmit={handleSubmit} className="dashboard-stack gap-4">
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
                  <div className="dashboard-inline-status is-danger justify-start rounded-full" role="alert">
                    <span className="dashboard-live-dot" />
                    {error}
                  </div>
                ) : null}

                <Button type="submit" size="lg" isLoading={isLoading} rightIcon={ArrowRight}>
                  Enter workspace
                </Button>
              </form>

              <div className="mt-6 border-t border-border-subtle pt-6">
                <DemoRoleSelector
                  onSelect={(selectedEmail) => {
                    setEmail(selectedEmail);
                    setPassword('password123');
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
      <LoginFooter />
    </div>
  );
}
