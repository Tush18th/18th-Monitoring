import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Activity, 
  BarChart3, 
  Link2, 
  Settings, 
  ChevronDown,
  LucideIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  activeHref: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  logo?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  groups, 
  activeHref, 
  isCollapsed, 
  onToggleCollapse,
  logo,
  className 
}) => {
  return (
    <aside className={cn('ui-sidebar', isCollapsed && 'collapsed', className)}>
      <div className="sidebar-header">
        <div className="logo-container">
          {logo || <div className="default-logo">18</div>}
          {!isCollapsed && <span className="app-name">18th Digitech</span>}
        </div>
        <button className="collapse-toggle" onClick={onToggleCollapse}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.name} className="nav-group">
            {!isCollapsed && <h3 className="group-label">{group.name}</h3>}
            <ul className="group-list">
              {group.items.map((item) => {
                const isActive = activeHref.startsWith(item.href);
                return (
                  <li key={item.href} className="nav-item-wrapper">
                    <a 
                      href={item.href} 
                      className={cn('nav-item', isActive && 'active')}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon size={20} className="nav-icon" />
                      {!isCollapsed && <span className="nav-label">{item.label}</span>}
                      {isActive && !isCollapsed && <div className="active-indicator" />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="system-status">
            <div className="status-indicator success" />
            <span className="status-text">System Active</span>
          </div>
        )}
      </div>
    </aside>
  );
};
