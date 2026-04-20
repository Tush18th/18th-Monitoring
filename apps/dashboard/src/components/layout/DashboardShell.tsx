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
import { useTheme } from '@kpi-platform/ui';
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  Package, 
  Link2, 
  Settings, 
  Bell, 
  UserCircle,
  ShieldCheck
} from 'lucide-react';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { theme } = useTheme();
  
  const projectId = params.projectId as string || '';

  // Context Bar State (in a real app, this might come from a dedicated context)
  const [selectedEnv, setSelectedEnv] = React.useState('Production');
  const [lastRefreshed, setLastRefreshed] = React.useState(new Date().toLocaleTimeString());

  // 1. RBAC: Project Access Guard
  useEffect(() => {
    if (!isLoading && user && projectId) {
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const isAssigned = user.assignedProjects?.includes(projectId);

      if (!isSuperAdmin && !isAssigned) {
        console.warn(`[RBAC] Unauthorized access attempt to project ${projectId} by user ${user.id}`);
        router.push('/unauthorized');
      }
    }
  }, [user, projectId, isLoading, router]);

  // 2. Build Navigation Groups with Role-Based filtering
  const navGroups = useMemo((): NavGroup[] => {
    const prefix = projectId ? `/project/${projectId}` : '';
    
    if (!prefix) return [];

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

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
          { label: 'Alerts',       href: `${prefix}/alerts`,        icon: Bell },
        ]
      }
    ];

    // Only add Governance section for Admin/SuperAdmin
    if (isAdmin) {
      groups.push({
        name: 'Governance',
        items: [
          { label: 'Audit & Activity', href: `${prefix}/management/audit`,   icon: ShieldCheck },
          { label: 'Configuration',    href: `${prefix}/settings`,          icon: Settings },
          { label: 'Administration',   href: `${prefix}/management/users`,  icon: UserCircle },
        ]
      });
    }

    return groups;
  }, [projectId, user?.role]);

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

  // Handle Refresh simulation
  const handleRefresh = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  // Don't show shell on login or unauthorized pages
  const isPublicPage = pathname === '/login' || pathname === '/unauthorized';
  if (isPublicPage || isLoading) return <>{children}</>;

  return (
    <AppShell
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
        <div className="flex items-center gap-2">
           <img 
            src="https://www.18thdigitech.com/images/logo.svg" 
            alt="18th Digitech"
            style={{ 
              height: '28px', 
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none', 
              objectFit: 'contain',
              transition: 'filter 0.3s ease'
            }}
          />
        </div>
      }
      
      // Context Bar Props
      projects={user?.assignedProjects?.map(id => ({ id, name: id.toUpperCase() })) || []}
      selectedProject={projectId}
      onProjectChange={(id) => router.push(`/project/${id}/overview`)}
      selectedEnvironment={selectedEnv}
      onEnvironmentChange={setSelectedEnv}
      lastUpdated={lastRefreshed}
      onRefresh={handleRefresh}
      freshnessStatus="healthy"
    >
      <div className="animate-fade-in">
        {children}
      </div>
    </AppShell>
  );
};
