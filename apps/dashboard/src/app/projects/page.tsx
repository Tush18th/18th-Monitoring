'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertTriangle, Building2, Activity, Users, FolderKanban, ShieldCheck } from 'lucide-react';
import { Card, PageLayout, Typography, Button } from '@kpi-platform/ui';
import { PerformanceChart } from '../../components/ui/PerformanceChart';
import { MetricCard } from '../../components/ui/MetricCard';
import { SectionHeader } from '../../components/ui/SectionHeader';

export default function ProjectsPage() {
  const { user, token, apiFetch, setProject } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    apiFetch('/api/v1/projects')
      .then((data) => {
        const results = Array.isArray(data) ? data : [];
        const authorized = results.filter(
          (project) => user?.role === 'SUPER_ADMIN' || user?.assignedProjects?.includes(project.id),
        );
        setProjects(authorized);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [token, apiFetch, user?.assignedProjects, user?.role]);

  const aggregateMetrics = useMemo(() => {
    const totalUsers = projects.reduce((sum, project) => sum + (project.metricsSummary?.activeUsers || 0), 0);
    const totalErrors = projects.reduce((sum, project) => sum + (project.metricsSummary?.errorRate || 0), 0);
    const projectsAtRisk = projects.filter((project) => (project.metricsSummary?.errorRate || 0) > 0).length;
    const avgHealth = projects.length > 0 ? Math.max(0, 100 - totalErrors / projects.length) : 100;

    return {
      totalProjects: projects.length,
      totalUsers,
      avgHealth: avgHealth.toFixed(1),
      projectsAtRisk,
    };
  }, [projects]);

  const trendData = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, index) => ({
        timestamp: `${index * 2}:00`,
        pageLoadTime: 220 + Math.random() * 180,
        ttfb: 90 + Math.random() * 70,
        fcp: 140 + Math.random() * 80,
        lcp: 380 + Math.random() * 240,
      })),
    [],
  );

  const openProject = (projectId: string) => {
    setProject(projectId);
    router.push(`/project/${projectId}/overview`);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-empty-state" style={{ minHeight: '60vh' }}>
        <FolderKanban size={44} />
        <Typography variant="h3">Loading your portfolio</Typography>
        <Typography variant="body" color="muted">
          Preparing project health, access, and traffic summaries.
        </Typography>
      </div>
    );
  }

  return (
    <PageLayout
      title="Portfolio Command Center"
      subtitle="Monitor every assigned project from one consistent operational view."
      actions={
        <span className={`dashboard-inline-status ${aggregateMetrics.projectsAtRisk > 0 ? 'is-danger' : 'is-success'}`}>
          <span className="dashboard-live-dot" />
          {aggregateMetrics.projectsAtRisk > 0
            ? `${aggregateMetrics.projectsAtRisk} project${aggregateMetrics.projectsAtRisk > 1 ? 's' : ''} need attention`
            : 'All assigned projects are stable'}
        </span>
      }
    >
      <div className="dashboard-page-body">
        <div className="dashboard-metrics-grid">
          <MetricCard
            title="Projects"
            value={aggregateMetrics.totalProjects}
            state="healthy"
            icon={<Building2 size={18} />}
          />
          <MetricCard
            title="Average Health"
            value={aggregateMetrics.avgHealth}
            unit="%"
            state={Number(aggregateMetrics.avgHealth) < 95 ? 'warning' : 'healthy'}
            icon={<Activity size={18} />}
          />
          <MetricCard
            title="Active Users"
            value={aggregateMetrics.totalUsers.toLocaleString()}
            state="healthy"
            icon={<Users size={18} />}
          />
          <MetricCard
            title="Projects at Risk"
            value={aggregateMetrics.projectsAtRisk}
            state={aggregateMetrics.projectsAtRisk > 0 ? 'critical' : 'healthy'}
            icon={<AlertTriangle size={18} />}
          />
        </div>

        <div className="dashboard-two-column">
          <Card title="Portfolio traffic profile" description="Synthetic portfolio trendline for cross-project latency patterns.">
            <PerformanceChart data={trendData} title="" />
          </Card>

          <Card
            title="Access summary"
            description="Your role scope and the current operational posture."
            extra={<ShieldCheck size={18} color="var(--success)" />}
          >
            <div className="dashboard-panel-list">
              <div className="dashboard-list-row">
                <div>
                  <Typography variant="caption" color="muted">
                    Signed in as
                  </Typography>
                  <Typography variant="body" weight="bold" noMargin>
                    {user.name}
                  </Typography>
                </div>
                <Typography variant="caption" color="secondary">
                  {user.role.replace('_', ' ')}
                </Typography>
              </div>
              <div className="dashboard-list-row">
                <div>
                  <Typography variant="caption" color="muted">
                    Project access
                  </Typography>
                  <Typography variant="body" weight="bold" noMargin>
                    {projects.length} assigned
                  </Typography>
                </div>
                <Typography variant="caption" color="secondary">
                  {user.role === 'SUPER_ADMIN' ? 'Global scope' : 'Scoped access'}
                </Typography>
              </div>
              <div className="dashboard-surface-note">
                Use the project cards below to jump into monitoring, alerts, integrations, and settings without leaving the portfolio view.
              </div>
            </div>
          </Card>
        </div>

        <section>
          <SectionHeader
            title="Assigned projects"
            subtitle="Every project card is fully actionable and takes you directly into the project workspace."
            icon={<FolderKanban size={16} />}
            action={
              <Typography variant="caption" color="muted">
                {projects.length} visible project{projects.length === 1 ? '' : 's'}
              </Typography>
            }
          />

          <div className="portfolio-grid">
            {projects.map((project) => {
              const health = Math.max(0, 100 - (project.metricsSummary?.errorRate || 0));
              const totalUsers = project.metricsSummary?.activeUsers || 0;
              const statusState = health < 95 ? 'warning' : 'healthy';

              return (
                <button
                  key={project.id}
                  type="button"
                  className="portfolio-card"
                  onClick={() => openProject(project.id)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <div className="dashboard-stack" style={{ gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <Typography variant="h3" noMargin>
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="muted">
                          {project.id}
                        </Typography>
                      </div>
                      <span className={`dashboard-inline-status ${statusState === 'warning' ? 'is-danger' : 'is-success'}`}>
                        {statusState === 'warning' ? 'Watchlist' : 'Healthy'}
                      </span>
                    </div>

                    <div className="dashboard-split-grid">
                      <div>
                        <Typography variant="caption" color="muted">
                          Active users
                        </Typography>
                        <Typography variant="h3" noMargin>
                          {totalUsers.toLocaleString()}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" color="muted">
                          Health score
                        </Typography>
                        <Typography variant="h3" noMargin>
                          {health.toFixed(1)}%
                        </Typography>
                      </div>
                    </div>

                    <div className="dashboard-action-row" style={{ justifyContent: 'space-between' }}>
                      <Typography variant="body" color="secondary">
                        Open project workspace
                      </Typography>
                      <ArrowRight size={18} color="var(--primary)" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {!projects.length ? (
          <div className="dashboard-empty-state">
            <FolderKanban size={44} />
            <Typography variant="h3">No projects assigned</Typography>
            <Typography variant="body" color="muted">
              Ask an administrator to assign you a project or grant broader visibility.
            </Typography>
            <Button variant="outline" onClick={() => router.push('/')}>
              Return to landing page
            </Button>
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
