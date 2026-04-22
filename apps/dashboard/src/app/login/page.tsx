'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input } from '@kpi-platform/ui';
import { 
  ArrowRight, Lock, Mail, ShieldCheck, Activity, Layers3, 
  CheckCircle2, Eye, EyeOff, Command, ChevronRight, User, MousePointer2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

const BrandLockup = () => (
  <div className="flex items-center gap-3 mb-8">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
      <Command size={24} />
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-bold tracking-tight text-slate-900">18th Digitech</span>
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600/80">Monitoring Workspace</span>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="flex-1 border-slate-100 bg-white/50 shadow-sm transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md" padding="none">
    <div className="p-[22px] flex flex-col gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>
      <div>
        <h4 className="text-xl font-semibold tracking-tight text-slate-900 mb-2">{title}</h4>
        <p className="text-[16px] leading-[1.6] text-slate-500">{description}</p>
      </div>
    </div>
  </Card>
);

const TrustItem = ({ icon: Icon, title, body }: { icon: any, title: string, body: string }) => (
  <div className="flex flex-col gap-1 px-4 first:pl-0 last:pr-0 border-r border-slate-100 last:border-0 md:flex-row md:items-start md:gap-3">
    <div className="mt-0.5 text-blue-500">
      <Icon size={16} />
    </div>
    <div>
      <h5 className="text-[13px] font-semibold text-slate-900 leading-tight">{title}</h5>
      <p className="text-[14px] text-slate-500 leading-normal">{body}</p>
    </div>
  </div>
);

const RoleSelectorItem = ({ icon: Icon, title, description, isSelected, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 p-4 rounded-[16px] border text-left transition-all duration-200",
      isSelected 
        ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-100" 
        : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm"
    )}
  >
    <div className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border",
      isSelected ? "text-blue-600 border-blue-100" : "text-slate-400 border-slate-100"
    )}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h5 className="text-[15px] font-semibold text-slate-900">{title}</h5>
        {isSelected && <ChevronRight size={16} className="text-blue-500" />}
      </div>
      <p className="text-[13px] text-slate-500 truncate">{description}</p>
    </div>
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] relative overflow-hidden font-sans flex items-center justify-center">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-50/50 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-50/40 to-transparent rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4" />

      <main className="relative z-10 w-full max-w-[1320px] px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-[80px] items-start lg:items-center">
          
          {/* Left Hero Section */}
          <section className="flex flex-col">
            <BrandLockup />
            
            <div className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-blue-50 border border-blue-100/50 w-fit mb-6">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[14px] font-semibold text-blue-600">Enterprise monitoring workspace</span>
            </div>

            <h1 className="text-[44px] lg:text-[52px] font-extrabold tracking-[-0.03em] leading-[1.1] text-slate-900 mb-6">
               Monitor commerce performance, platform health, and operational KPIs from one unified workspace.
            </h1>

            <p className="text-[18px] lg:text-[19px] leading-[1.65] text-slate-600 max-w-[620px] mb-4">
              Centralize telemetry, integrations, alerts, project governance, and team access in a secure environment built for modern digital operations.
            </p>

            <span className="text-[15px] font-semibold text-slate-800 mb-10">
              Built for operations teams, project leads, and enterprise stakeholders.
            </span>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              <FeatureCard 
                icon={Activity} 
                title="Operational visibility" 
                description="Track live metrics, latency, incidents, and service health across projects." 
              />
              <FeatureCard 
                icon={ShieldCheck} 
                title="Controlled access" 
                description="Assign role-based access for admins, leads, and stakeholders with confidence." 
              />
              <FeatureCard 
                icon={Layers3} 
                title="Actionable workflows" 
                description="Connect monitoring, issue tracking, governance, and reporting in one place." 
              />
            </div>

            {/* Trust / Security Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-blue-50/30 border border-blue-100/50 rounded-[22px] p-5">
              <TrustItem 
                icon={MousePointer2} 
                title="SSO enabled" 
                body="Enterprise-ready authentication and secure workspace access." 
              />
              <TrustItem 
                icon={Lock} 
                title="Encrypted sessions" 
                body="Protected routing and token-based session security." 
              />
              <TrustItem 
                icon={CheckCircle2} 
                title="Auditable actions" 
                body="Critical activity remains visible and traceable." 
              />
            </div>
          </section>

          {/* Right Login Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="auth-card-shadow w-full max-w-[500px] rounded-[24px] bg-white border border-slate-200/60 p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                <h2 className="text-[28px] lg:text-[30px] font-bold text-slate-900 mb-2 leading-tight">Sign in to your workspace</h2>
                <p className="text-[15px] lg:text-[16px] leading-[1.6] text-slate-600 mb-8 font-medium">
                  Use your work credentials to continue, or explore the platform using a predefined demo role.
                </p>

                <div className="h-px bg-slate-100 w-full mb-8" />

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-bold text-slate-800">Work email</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[54px] pl-12 pr-4 rounded-[14px] border border-slate-200 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-bold text-slate-800">Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-[54px] pl-12 pr-12 rounded-[14px] border border-slate-200 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-[13px] text-slate-400 mt-1">For demo access, use the shared password shown below.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[14px] font-semibold flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                    <div className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-slate-50 text-slate-600 text-[13px] font-semibold">
                       <ShieldCheck size={16} className="text-slate-400" />
                       Secure session enabled
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto h-[54px] px-8 rounded-[14px] bg-blue-600 hover:bg-blue-700 text-[15px] font-bold flex items-center justify-center gap-2"
                      isLoading={isLoading}
                    >
                      Sign in
                    </Button>
                  </div>
                </form>

                {/* Demo Roles Section */}
                <div className="mt-8 flex flex-col gap-4">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                      Explore demo roles
                    </h3>
                    <p className="text-[13px] text-slate-500">Preview the workspace with predefined access levels.</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <RoleSelectorItem 
                      icon={ShieldCheck} 
                      title="Platform Admin" 
                      description="Full workspace control, governance, and infrastructure visibility" 
                      isSelected={email === 'superadmin@monitor.io'}
                      onClick={() => selectDemoRole('superadmin@monitor.io')}
                    />
                    <RoleSelectorItem 
                      icon={User} 
                      title="Project Lead" 
                      description="Project performance, team operations, and alert ownership" 
                      isSelected={email === 'admin@store001.com'}
                      onClick={() => selectDemoRole('admin@store001.com')}
                    />
                    <RoleSelectorItem 
                      icon={Eye} 
                      title="System Viewer" 
                      description="Read-only access to monitoring dashboards and telemetry" 
                      isSelected={email === 'viewer@store001.com'}
                      onClick={() => selectDemoRole('viewer@store001.com')}
                    />
                  </div>
                  
                  <p className="text-[12px] lg:text-[13px] text-slate-400 text-center font-medium">
                    All demo roles use the same shared password.
                  </p>
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 lg:mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8 text-[13px] text-slate-400 font-medium">
             <div className="flex items-center gap-2">
               <ShieldCheck size={14} className="text-slate-300" />
               AES-256 Encryption
             </div>
             <div className="flex items-center gap-2">
               <ShieldCheck size={14} className="text-slate-300" />
               SOC 2 Type II Compliant
             </div>
          </div>
          <div className="flex items-center gap-8 text-[13px] text-slate-400 font-medium">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <span className="text-slate-500 font-bold">&copy; 2026 18th Digitech</span>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        .auth-card-shadow {
           box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.01), 0 2px 4px -2px rgb(0 0 0 / 0.01), 0 20px 40px -4px rgb(0 0 0 / 0.03);
        }
      `}</style>
    </div>
  );
}
