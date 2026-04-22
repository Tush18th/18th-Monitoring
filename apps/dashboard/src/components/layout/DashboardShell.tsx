'use client';
import React, { useMemo, useEffect } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { 
  AppShell, 
  NavGroup, 
  BreadcrumbItem, 
  formatBreadcrumbLabel 
} from '@kpi-platform/ui';
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  Package, 
  Link2, 
  Settings, 
  Bell, 
  UserCircle,
  ShieldCheck,
  GitMerge, 
  Database, 
  ShieldAlert, 
  BarChart3
} from 'lucide-react';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { user, logout, isLoading, apiFetch, token, setProject } = useAuth();
  
  const projectId = params.projectId as string || '';

  // Context Bar & Project State
  const [selectedEnv, setSelectedEnv] = React.useState('Production');
  const [lastRefreshed, setLastRefreshed] = React.useState(new Date().toLocaleTimeString());
  const [availableProjects, setAvailableProjects] = React.useState<any[]>([]);
  const [alertCount, setAlertCount] = React.useState<number>(0);

  // 1. RBAC & Project Context Synchronization
  useEffect(() => {
    if (!isLoading && user && projectId) {
      // Sync global project context for API auto-scoping
      setProject(projectId);

      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const isTenantAdmin = user.role === 'TENANT_ADMIN';
      const isAssigned = user.assignedProjects?.includes(projectId);

      if (!isSuperAdmin && !isTenantAdmin && !isAssigned) {
        console.warn(`[RBAC] Unauthorized access attempt to project ${projectId} by user ${user.id}`);
        router.push('/unauthorized');
      }
    }
  }, [user, projectId, isLoading, router, setProject]);

  // 2. Fetch Projects for Switcher
  useEffect(() => {
    if (!token || !user) return;
    
    apiFetch('/api/v1/projects')
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableProjects(data);
        }
      })
      .catch(err => console.error('[DashboardShell] Failed to load projects:', err));
  }, [token, user, apiFetch]);

  // 3. Fetch Alert Count
  useEffect(() => {
    if (!token || !projectId) return;

    const fetchAlerts = () => {
      apiFetch(`/api/v1/tenants/current/projects/${projectId}/alerts?status=active`)
        .then(data => {
          const criticalCount = data?.data?.alerts?.filter((a: any) => a.severity === 'critical')?.length || 0;
          setAlertCount(criticalCount);
        })
        .catch(err => console.error('[DashboardShell] Failed to load alerts:', err));
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // 1-minute polling
    return () => clearInterval(interval);
  }, [token, projectId, apiFetch]);

  // 4. Build Navigation Groups
  const navGroups = useMemo((): NavGroup[] => {
    const prefix = projectId ? `/project/${projectId}` : '';
    if (!prefix) return [];

    const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PROJECT_ADMIN';

    const groups: NavGroup[] = [
      {
        name: 'Operational Surface',
        items: [
          { label: 'Overview',     href: `${prefix}/overview`,     icon: LayoutDashboard },
          { label: 'Performance',  href: `${prefix}/performance`,  icon: Activity },
          { label: 'Customers',    href: `${prefix}/customers`,    icon: Users },
          { label: 'Orders',       href: `${prefix}/orders`,        icon: Package },
        ]
      },
      {
        name: 'Ecosystem',
        items: [
          { label: 'Integrations', href: `${prefix}/integrations`,  icon: Link2 },
          { label: 'Alerts',       href: `${prefix}/alerts`,        icon: Bell, badge: alertCount },
        ]
      }
    ];

    if (isAdmin) {
      groups.push(
        {
          name: 'Data Platform',
          items: [
            { label: 'Ingestion',    href: `${prefix}/management/ingestion`,  icon: Database },
            { label: 'Pipeline',     href: `${prefix}/management/pipeline`,   icon: GitMerge },
            { label: 'KPI Engine',   href: `${prefix}/management/kpi`,        icon: BarChart3 },
            { label: 'Monitoring',   href: `${prefix}/management/monitoring`, icon: ShieldAlert },
          ]
        },
        {
          name: 'Governance',
          items: [
            { label: 'Audit & Activity', href: `${prefix}/management/audit`,   icon: ShieldCheck },
            { label: 'Configuration',    href: `${prefix}/settings`,           icon: Settings },
            { label: 'Administration',   href: `${prefix}/management/users`,   icon: UserCircle },
          ]
        }
      );
    }

    return groups;
  }, [projectId, user?.role, alertCount]);

  // 3. Derive Breadcrumbs
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      let label = formatBreadcrumbLabel(segment);
      if (segment === projectId) {
        label = `Project: ${segment.toUpperCase()}`;
      }
      items.push({
        label,
        href: currentPath,
        isLast: index === segments.length - 1
      });
    });

    return items;
  }, [pathname, projectId]);

  const handleRefresh = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  const isPublicPage = pathname === '/login' || pathname === '/unauthorized';
  if (isPublicPage || isLoading) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden">
      {/* Background Decorative Elements for Premium Feel */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <AppShell
        showSidebar={!!projectId}
        defaultCollapsed={!!projectId}
        navGroups={navGroups}
        activeHref={pathname}
        breadcrumbs={breadcrumbs}
        user={{
          name: user?.name || 'Administrator',
          email: user?.email || '',
        }}
        onLogout={logout}
        onNavigate={(href) => router.push(href)}
        logo={
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/projects')}>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              <span className="relative z-10">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter leading-none text-text-primary">GRAVITY</span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-primary uppercase">Monitor</span>
            </div>
          </div>
        }
        
        projects={availableProjects.length > 0 
          ? availableProjects.map(p => ({ id: p.id, name: p.name })) 
          : user?.assignedProjects?.map(id => ({ id, name: id.toUpperCase() })) || []
        }
        selectedProject={projectId}
        onProjectChange={(id) => router.push(`/project/${id}/overview`)}
        selectedEnvironment={selectedEnv}
        onEnvironmentChange={setSelectedEnv}
        lastUpdated={lastRefreshed}
        onRefresh={handleRefresh}
        freshnessStatus="healthy"
      >
        <div className="animate-fade-in relative z-10">
          {children}
        </div>
      </AppShell>
    </div>
  );
};
