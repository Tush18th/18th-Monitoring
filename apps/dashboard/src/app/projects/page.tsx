'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  AlertTriangle, 
  Building2, 
  Activity, 
  Users, 
  FolderKanban, 
  ShieldCheck, 
  LayoutDashboard, 
  Info,
  Clock,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { Card, Typography, Button, Badge } from '@kpi-platform/ui';
import { PerformanceChart } from '../../components/ui/PerformanceChart';

// --- Local Components for Portfolio Specifics ---

const PortfolioMetricCard = ({ 
  title, 
  value, 
  unit = '', 
  state = 'healthy', 
  icon: Icon, 
  secondaryTag 
}: any) => {
  const statusColors = {
    healthy: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    critical: 'text-error bg-error/10 border-error/20'
  };

  const dotColors = {
    healthy: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-error'
  };

  return (
    <div className="group relative bg-bg-surface border border-border-subtle rounded-[20px] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30">
      {/* Icon - Top Right */}
      <div className="absolute top-6 right-6 p-2 rounded-xl bg-bg-muted/50 text-text-muted group-hover:text-primary transition-colors">
        <Icon size={20} />
      </div>

      <div className="flex flex-col h-full justify-between gap-6">
        <div>
          <Typography variant="micro" color="muted" weight="bold" className="uppercase tracking-widest mb-1">
            {title}
          </Typography>
          <div className="flex items-baseline gap-1">
            <Typography variant="h1" noMargin className="text-3xl font-black tracking-tighter text-text-primary">
              {value}
            </Typography>
            {unit && <span className="text-sm font-bold text-text-muted">{unit}</span>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Status Badge - Bottom Left */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusColors[state as keyof typeof statusColors]}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColors[state as keyof typeof dotColors]}`} />
            {state}
          </div>

          {/* Secondary Tag - Bottom Right */}
          {secondaryTag && (
            <span className="text-[10px] font-bold text-text-muted/60 flex items-center gap-1">
              <TrendingUp size={10} />
              {secondaryTag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project, onClick }: any) => {
  const health = Math.max(0, 100 - (project.metricsSummary?.errorRate || 0));
  const totalUsers = project.metricsSummary?.activeUsers || 0;
  const statusState = health < 95 ? 'warning' : 'healthy';

  return (
    <button
      onClick={onClick}
      className="group flex flex-col bg-bg-surface border border-border-subtle rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      
      <div className="relative z-10 flex flex-col h-full gap-5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <Typography variant="h3" noMargin weight="bold" className="text-lg group-hover:text-primary transition-colors">
              {project.name}
            </Typography>
            <Typography variant="micro" color="muted" className="font-mono tracking-tighter mt-0.5">
              ID: {project.id.toUpperCase()}
            </Typography>
          </div>
          <div className={`p-2 rounded-lg ${statusState === 'warning' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
             {statusState === 'warning' ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-bg-muted/40 border border-border-subtle/50">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Live Traffic</span>
            <span className="text-base font-black text-text-primary">{totalUsers.toLocaleString()}</span>
          </div>
          <div className="flex flex-col border-l border-border-subtle/50 pl-3">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">System Health</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-base font-black ${statusState === 'warning' ? 'text-warning' : 'text-success'}`}>
                {health.toFixed(0)}%
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${statusState === 'warning' ? 'bg-warning' : 'bg-success'} animate-pulse`} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-subtle/30">
          <span className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            Launch Workspace
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </button>
  );
};

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-bg-muted flex items-center justify-center">
          <LayoutDashboard size={32} className="text-text-muted" />
        </div>
        <div>
          <div className="h-8 w-64 bg-bg-muted rounded-lg mb-2 mx-auto" />
          <div className="h-4 w-48 bg-bg-muted rounded-lg mx-auto opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-10 pb-20">
      {/* 4. Header Section Refinement */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Typography variant="h1" noMargin className="text-3xl font-black tracking-tight text-text-primary">
              Portfolio Command Center
            </Typography>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-black text-success uppercase tracking-widest">Live</span>
            </div>
          </div>
          <Typography variant="body" color="muted" className="text-sm font-medium tracking-tight">
            Consolidated operational surface for all authorized project streams.
          </Typography>
        </div>

        <div className="flex items-center gap-4">
          {metrics.projectsAtRisk > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-error/10 border border-error/20 text-error animate-fade-in shadow-sm shadow-error/5">
              <ShieldAlert size={14} className="animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                {metrics.projectsAtRisk} projects need attention
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 p-1.5 bg-bg-surface border border-border-subtle rounded-xl shadow-sm">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-bg-muted transition-colors text-xs font-bold text-text-secondary">
              <Clock size={14} />
              Last 24h
            </button>
          </div>
        </div>
      </header>

      {/* 5. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <PortfolioMetricCard
          title="Active Projects"
          value={metrics.totalProjects}
          state="healthy"
          icon={Building2}
          secondaryTag="Global Scope"
        />
        <PortfolioMetricCard
          title="Portfolio Health"
          value={metrics.avgHealth}
          unit="%"
          state={Number(metrics.avgHealth) < 95 ? 'warning' : 'healthy'}
          icon={Activity}
          secondaryTag="Real-time"
        />
        <PortfolioMetricCard
          title="Active Operators"
          value={metrics.totalUsers.toLocaleString()}
          state="healthy"
          icon={Users}
          secondaryTag="Sessions"
        />
        <PortfolioMetricCard
          title="Incident Surface"
          value={metrics.projectsAtRisk}
          state={metrics.projectsAtRisk > 0 ? 'critical' : 'healthy'}
          icon={AlertTriangle}
          secondaryTag="Open Alerts"
        />
      </div>

      {/* 6. Trendline + Operational Context Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="lg:col-span-8">
          <Card className="h-full rounded-[24px] overflow-hidden border-border-subtle/60 shadow-xl shadow-black/5">
            <div className="p-6 border-b border-border-subtle/40 flex items-center justify-between bg-bg-surface">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Activity size={18} />
                </div>
                <div>
                   <Typography variant="h3" noMargin weight="bold">Cross-portfolio Trendline</Typography>
                   <Typography variant="caption" color="muted">Global synthetic latency patterns (24h)</Typography>
                </div>
              </div>
            </div>
            <div className="p-6 bg-bg-muted/10 min-h-[320px] flex flex-col justify-center">
              <PerformanceChart data={trendData} title="" />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full rounded-[24px] border-border-subtle/60 shadow-xl shadow-black/5 bg-bg-surface">
            <div className="p-6 border-b border-border-subtle/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                  <ShieldCheck size={18} />
                </div>
                <Typography variant="h3" noMargin weight="bold">Operational Context</Typography>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-muted/30 border border-border-subtle/40">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Operator Identity</span>
                    <Typography variant="body" weight="bold" noMargin className="text-text-primary">{user.name}</Typography>
                  </div>
                  <Badge variant="info" size="sm" className="font-black">{user.role.replace('_', ' ')}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-muted/30 border border-border-subtle/40">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Authorized Scope</span>
                    <Typography variant="body" weight="bold" noMargin className="text-text-primary">{projects.length} Workspaces</Typography>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                     <ShieldCheck size={16} />
                  </div>
                </div>
              </div>

              <div className="relative p-5 rounded-2xl bg-primary/5 border border-primary/10 overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Info size={40} />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-2">Portfolio Intelligence</span>
                <Typography variant="caption" className="text-text-secondary leading-relaxed font-medium">
                  Currently observing {projects.length} active data streams. Launch a project workspace for deep-dive diagnostics and infrastructure reporting.
                </Typography>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 7. Project Portfolio Section */}
      <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border-subtle flex items-center justify-center text-primary shadow-sm">
              <FolderKanban size={20} />
            </div>
            <div>
              <Typography variant="h2" noMargin className="text-2xl font-black tracking-tight">Project Portfolio</Typography>
              <Typography variant="caption" color="muted">Secure entry points for all assigned project workspaces.</Typography>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-muted/50 border border-border-subtle text-[11px] font-bold text-text-muted">
            <Activity size={12} className="text-success" />
            {projects.length} ACTIVE STREAMS
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project, i) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={() => openProject(project.id)} 
            />
          ))}

          {!projects.length && (
            <div className="col-span-full py-20 bg-bg-surface border border-dashed border-border-subtle rounded-[32px] flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-bg-muted flex items-center justify-center text-text-muted">
                <FolderKanban size={32} />
              </div>
              <div className="space-y-1">
                <Typography variant="h3" noMargin>No projects assigned</Typography>
                <Typography variant="body" color="muted">Ask an administrator to grant you workspace access.</Typography>
              </div>
              <Button variant="primary" className="mt-4 px-8 rounded-full font-black">
                Request Access
              </Button>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
