import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  LucideIcon,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  badge?: number | string;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  activeHref: string;
  onNavigate?: (href: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  logo?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  groups, 
  activeHref, 
  onNavigate,
  isCollapsed, 
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  logo,
  className 
}) => {
  return (
    <aside className={cn(
      "fixed lg:relative z-[150] h-screen transition-all duration-300 border-r border-border-subtle bg-bg-surface flex flex-col shadow-xl lg:shadow-none",
      isCollapsed ? "w-[85px]" : "w-[280px]",
      isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      className
    )}>
      {/* Sidebar Header */}
      <div className="h-16 px-6 border-b border-border-subtle flex items-center justify-between overflow-hidden bg-surface-overlay/30">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black shadow-primary/20 shadow-lg">
            {logo || "18"}
          </div>
          {!isCollapsed && <span className="font-bold text-lg tracking-tight text-text-primary whitespace-nowrap">18th Digitech</span>}
        </div>
        <button 
          className="p-1.5 hover:bg-bg-muted rounded-md text-text-muted transition-colors hidden lg:flex" 
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 custom-scrollbar">
        {groups.map((group) => (
          <div key={group.name} className="flex flex-col gap-2">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] uppercase font-black tracking-[0.18em] text-text-muted opacity-50 mb-1">
                {group.name}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeHref.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                      isActive 
                        ? "bg-primary/10 text-primary shadow-[inset_0_0_12px_rgba(37,99,235,0.05)]" 
                        : "text-text-secondary hover:bg-muted/40 hover:text-text-primary"
                    )}
                    onClick={() => {
                      onNavigate?.(item.href);
                      onCloseMobile?.();
                    }}
                  >
                    {item.icon ? (
                      <item.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                    ) : (
                      <AlertCircle size={20} className="shrink-0 text-error/50" />
                    )}
                    {!isCollapsed && <span className="text-sm font-bold tracking-tight whitespace-nowrap">{item.label}</span>}
                    {!isCollapsed && item.badge !== undefined && item.badge !== 0 && (
                        <div className="ml-auto bg-error text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                            {item.badge}
                        </div>
                    )}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-l-full shadow-[0_0_12px_rgba(37,99,235,0.5)]" />
                    )}
                    
                    {/* Hover tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-[70px] flex items-center gap-2 bg-strong text-white text-[10px] font-bold px-3 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10 uppercase tracking-widest">
                        <span>{item.label}</span>
                        {item.badge !== undefined && item.badge !== 0 && (
                          <span className="bg-error text-white px-1.5 py-0.5 rounded-md leading-none">{item.badge}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border-subtle bg-muted/5 mt-auto">
        {!isCollapsed ? (
          <div className="p-3 bg-success/5 rounded-2xl border border-success/15 flex items-center gap-3 group hover:border-success/30 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-success">Live Feed</span>
              <span className="text-[9px] text-text-muted mt-0.5">System Nominal</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        )}
      </div>
    </aside>
  );
};
