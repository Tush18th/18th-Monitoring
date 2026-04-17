import React from 'react';
import { ShieldCheck, User, Eye } from 'lucide-react';
import { RoleCard } from './RoleCard';

interface DemoRoleSelectorProps {
    onSelect: (email: string) => void;
}

const ROLES = [
    {
        title: 'Platform Admin',
        desc: 'Infrastructure control',
        email: 'superadmin@monitor.io',
        icon: ShieldCheck,
    },
    {
        id: 'PROJECT_ADMIN',
        title: 'Project Lead',
        desc: 'Manage teams & alerts',
        email: 'admin@store001.com',
        icon: User,
    },
    {
        title: 'System Viewer',
        desc: 'Visual telemetry only',
        email: 'viewer@store001.com',
        icon: Eye,
    },
];

export const DemoRoleSelector: React.FC<DemoRoleSelectorProps> = ({ onSelect }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Quick Access
                </label>
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold uppercase transition-colors">
                    Demo Mode
                </span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {ROLES.map((role) => (
                    <RoleCard
                        key={role.email}
                        title={role.title}
                        description={role.desc}
                        icon={role.icon}
                        onClick={() => onSelect(role.email)}
                    />
                ))}
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2">
                All accounts use <span className="font-mono text-slate-600 dark:text-slate-400">password123</span>
            </p>
        </div>
    );
};
