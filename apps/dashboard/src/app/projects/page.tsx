'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PerformanceChart } from '../../components/ui/PerformanceChart';
import { useAuth } from '../../context/AuthContext';

type ProjectSummary = {
  id: string;
  name: string;
  metricsSummary?: {
    activeUsers?: number;
    errorRate?: number;
  };
};

const timeFilters = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
] as const;

function formatValue(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function buildTrendData(range: string) {
  const factor = range === '7d' ? 1.12 : range === '30d' ? 1.22 : 1;

  return Array.from({ length: 12 }).map((_, index) => ({
    timestamp: `${String(index * 2).padStart(2, '0')}:00`,
    pageLoadTime: 220 + index * 8 * factor + Math.sin(index / 2) * 18,
    ttfb: 90 + index * 3 * factor + Math.cos(index / 2) * 7,
    fcp: 145 + index * 4 * factor + Math.sin(index / 3) * 9,
    lcp: 380 + index * 10 * factor + Math.cos(index / 4) * 16,
  }));
}

function getHealthTone(health: number) {
  if (health < 92) return 'critical';
  if (health < 97) return 'warning';
  return 'healthy';
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  statusLabel,
  statusTone,
  secondaryTag,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  statusLabel: string;
  statusTone: 'healthy' | 'warning' | 'critical';
  secondaryTag: string;
}) => {
  const toneClasses = {
    healthy: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    critical: 'text-error bg-error/10 border-error/20',
  };

  return (
    <div className="group relative h-full min-h-[168px] rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5">
      <div className="absolute right-5 top-5 rounded-xl bg-bg-muted/60 p-2 text-text-muted transition-colors group-hover:text-primary">
        <Icon size={20} />
      </div>

      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{title}</div>
          <div className="text-4xl font-black tracking-tight text-text-primary">{value}</div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClasses[statusTone]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusTone === 'healthy' ? 'bg-success' : statusTone === 'warning' ? 'bg-warning' : 'bg-error'} animate-pulse`} />
            {statusLabel}
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
            <TrendingUp size={11} />
            {secondaryTag}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({
  project,
  onOpen,
  isPending,
}: {
  project: ProjectSummary;
  onOpen: (projectId: string) => void;
  isPending: boolean;
}) => {
  const traffic = project.metricsSummary?.activeUsers || 0;
  const health = Math.max(0, 100 - (project.metricsSummary?.errorRate || 0));
  const tone = getHealthTone(health);

  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      aria-busy={isPending}
      className="group relative flex h-full min-h-[228px] flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/[0.03] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold tracking-tight text-text-primary transition-colors group-hover:text-primary">
                {project.name}
              </div>
              <div className="mt-1 font-mono text-[11px] font-medium tracking-[0.12em] text-text-muted">
                ID {project.id.toUpperCase()}
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                tone === 'healthy'
                  ? 'border-success/20 bg-success/10 text-success'
                  : tone === 'warning'
                    ? 'border-warning/20 bg-warning/10 text-warning'
                    : 'border-error/20 bg-error/10 text-error'
              }`}
            >
              {tone === 'healthy' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
              {tone}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border-subtle/70 bg-bg-muted/35 p-3">
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Live Traffic</div>
              <div className="text-2xl font-black tracking-tight text-text-primary">{formatValue(traffic)}</div>
            </div>

            <div className="space-y-1 border-l border-border-subtle/70 pl-3">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">System Health</div>
              <div className={`text-2xl font-black tracking-tight ${tone === 'healthy' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-error'}`}>
                {health.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle/60 pt-4">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            {isPending ? 'Opening workspace...' : 'Launch Workspace'}
          </div>
          <ArrowRight size={16} className={`text-text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary ${isPending ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    </button>
  );
};

export default function ProjectsPage() {
  const { user, token, apiFetch, setProject } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    apiFetch('/api/v1/projects')
      .then((data) => {
        const results = Array.isArray(data) ? data : [];
        const authorized = results.filter(
          (project) => ['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user?.role || '') || user?.assignedProjects?.includes(project.id),
        );
        setProjects(authorized);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [token, apiFetch, user?.assignedProjects, user?.role]);

  const metrics = useMemo(() => {
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

  const trendData = useMemo(() => buildTrendData(selectedRange), [selectedRange]);

  const openProject = (projectId: string) => {
    setPendingProjectId(projectId);
    setProject(projectId);
    router.push(`/project/${projectId}/overview`);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
          <div className="h-28 rounded-3xl border border-border-subtle bg-bg-surface/80 p-6 shadow-sm">
            <div className="h-6 w-72 rounded-full bg-bg-muted animate-pulse" />
            <div className="mt-4 h-4 w-96 rounded-full bg-bg-muted/70 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[168px] rounded-2xl border border-border-subtle bg-bg-surface animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-[-12%] top-[8%] h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-border-subtle bg-[color-mix(in_srgb,var(--bg-base)_86%,transparent)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-semibold tracking-tight text-text-primary sm:text-[30px]">
                  Portfolio Command Center
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-text-muted">
                Consolidated operational surface for all authorized project streams, optimized for fast scanning and precise workspace entry.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-3 xl:justify-end">
              {metrics.projectsAtRisk > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error/10 px-4 py-2 text-error shadow-sm">
                  <AlertTriangle size={14} />
                  <span className="text-[11px] font-black uppercase tracking-[0.16em]">
                    {metrics.projectsAtRisk} projects need attention
                  </span>
                </div>
              )}

              <div className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-surface p-1 shadow-sm">
                {timeFilters.map((filter) => {
                  const active = selectedRange === filter.value;
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSelectedRange(filter.value)}
                      className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-150 active:scale-[0.98] ${
                        active
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-muted hover:bg-bg-muted hover:text-text-primary'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-muted transition-all duration-150 hover:border-primary/25 hover:text-primary hover:shadow-md active:scale-[0.98]"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {metrics.projectsAtRisk > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-bg-surface" />
                )}
              </button>

              <button
                type="button"
                className="flex items-center gap-3 rounded-full border border-border-subtle bg-bg-surface px-3 py-2 transition-all duration-150 hover:border-primary/25 hover:shadow-md active:scale-[0.99]"
                aria-label="User profile"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                  {user.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-semibold text-text-primary">{user.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown size={14} className="text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-10">
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Active Projects"
              value={formatValue(metrics.totalProjects)}
              icon={Building2}
              statusLabel="Portfolio"
              statusTone="healthy"
              secondaryTag="Global Scope"
            />
            <MetricCard
              title="Portfolio Health"
              value={`${metrics.avgHealth}%`}
              icon={Activity}
              statusLabel={Number(metrics.avgHealth) < 95 ? 'Warning' : 'Healthy'}
              statusTone={Number(metrics.avgHealth) < 95 ? 'warning' : 'healthy'}
              secondaryTag="Real Time"
            />
            <MetricCard
              title="Active Operators"
              value={formatValue(metrics.totalUsers)}
              icon={Users}
              statusLabel="Live Sessions"
              statusTone="healthy"
              secondaryTag="Connected"
            />
            <MetricCard
              title="Incident Surface"
              value={formatValue(metrics.projectsAtRisk)}
              icon={AlertTriangle}
              statusLabel={metrics.projectsAtRisk > 0 ? 'Critical' : 'Stable'}
              statusTone={metrics.projectsAtRisk > 0 ? 'critical' : 'healthy'}
              secondaryTag="Open Alerts"
            />
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-border-subtle/70 px-6 py-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <div className="text-lg font-semibold tracking-tight text-text-primary">Cross-portfolio Trendline</div>
                        <div className="text-sm text-text-muted">Synthetic performance pattern for the selected time range.</div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden flex-wrap items-center justify-end gap-2 xl:flex">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-muted/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Page Load
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-muted/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      LCP
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-muted/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      FCP
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-muted/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      TTFB
                    </span>
                  </div>
                </div>

                <div className="flex-1 px-6 py-5">
                  <div className="min-h-[320px]">
                    <PerformanceChart data={trendData} title="" height={320} />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface shadow-sm">
                <div className="border-b border-border-subtle/70 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-secondary/10 p-2 text-secondary">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div className="text-lg font-semibold tracking-tight text-text-primary">Operational Context</div>
                      <div className="text-sm text-text-muted">Identity, scope, and portfolio intelligence at a glance.</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="rounded-2xl border border-border-subtle/70 bg-bg-muted/30 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Operator Identity</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-text-primary">{user.name}</div>
                        <div className="text-sm text-text-muted">{user.email}</div>
                      </div>
                      <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                        {user.role.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border-subtle/70 bg-bg-muted/30 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Authorized Scope</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-text-primary">{metrics.totalProjects} workspaces</div>
                        <div className="text-sm text-text-muted">Accessible portfolio count</div>
                      </div>
                      <div className="rounded-full bg-success/10 p-2 text-success">
                        <Sparkles size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Portfolio Intelligence</div>
                    <div className="mt-2 space-y-3">
                      <p className="text-sm leading-6 text-text-secondary">
                        Monitoring {metrics.totalProjects} active streams with a stable control surface for fast workspace entry and reduced cognitive load.
                      </p>
                      <div className="space-y-2 border-t border-primary/10 pt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Attention surface</span>
                          <span className="font-semibold text-text-primary">{metrics.projectsAtRisk} projects</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Scanning effort</span>
                          <span className="font-semibold text-text-primary">Low</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Navigation depth</span>
                          <span className="font-semibold text-text-primary">Portfolio first</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-border-subtle bg-bg-surface p-2 text-primary shadow-sm">
                    <FolderKanban size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tracking-tight text-text-primary">Project Portfolio</div>
                    <div className="text-sm text-text-muted">Each card is a direct launch point into a project workspace.</div>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-text-muted shadow-sm">
                <LayoutDashboard size={12} className="text-success" />
                {metrics.totalProjects} active streams
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={openProject}
                  isPending={pendingProjectId === project.id}
                />
              ))}

              {!projects.length && (
                <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-border-subtle bg-bg-surface px-8 py-20 text-center">
                  <div className="rounded-2xl bg-bg-muted p-4 text-text-muted">
                    <FolderKanban size={32} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-semibold tracking-tight text-text-primary">No projects assigned</div>
                    <div className="text-sm text-text-muted">Ask an administrator to grant workspace access.</div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-150 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                  >
                    Request Access
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
