'use client';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '@kpi-platform/ui';
import { Mail, Lock, ChevronRight, Activity, Zap, Shield, Target } from 'lucide-react';
import { LoginHeader } from '../../components/auth/LoginHeader';
import { LoginFooter } from '../../components/auth/LoginFooter';
import { DemoRoleSelector } from '../../components/auth/DemoRoleSelector';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    const handleDemoSelect = (selectedEmail: string) => {
        setEmail(selectedEmail);
        setPassword('password123');
    };

    return (
        <div className="relative min-h-screen bg-[#fcfcfd] dark:bg-[#020617] flex flex-col font-sans transition-colors duration-700">
            {/* Background Mesh Gradients */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <LoginHeader />
            
            <main className="flex-1 flex items-center justify-center py-20 px-6 sm:px-12 relative z-10">
                <div className="w-full max-w-[1280px] grid lg:grid-cols-[1fr_440px] gap-16 xl:gap-24 items-center">
                    
                    {/* Left Column: Hero Content */}
                    <div className="hidden lg:flex flex-col space-y-10 animate-fade-in">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                    Trusted by 500+ Engineering Teams
                                </span>
                            </div>

                            <h1 className="text-5xl xl:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                                Performance monitoring<br />
                                <span className="auth-gradient-text">built for scale.</span>
                            </h1>

                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-[540px] leading-relaxed font-medium">
                                Gain unified visibility into your infrastructure, application performance, and business KPIs with our enterprise-grade telemetry engine.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-8 max-w-2xl">
                            {[
                                { title: 'Real-time Telemetry', desc: 'Sub-second data ingestion', icon: Zap },
                                { title: 'AI Anomaly Detection', desc: 'Predict issues before they occur', icon: Activity },
                                { title: 'Unified Governance', desc: 'Enterprise-wide RBAC & security', icon: Shield },
                                { title: 'System Observability', desc: 'Full-stack infrastructure health', icon: Target },
                            ].map((feature) => (
                                <div key={feature.title} className="flex gap-4 group">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-110 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-all duration-300">
                                        <feature.icon size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">{feature.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Login Card */}
                    <div className="w-full">
                        <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 auth-card-shadow p-10 rounded-2xl relative overflow-hidden transition-all duration-300">
                            <div className="mb-10">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Please enter your details to sign in</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1">Work Email</label>
                                    <Input
                                        type="email"
                                        placeholder="j.doe@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        icon={Mail}
                                        required
                                        className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl auth-input-focus text-slate-900 dark:text-white font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1">Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        icon={Lock}
                                        required
                                        className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl auth-input-focus text-slate-900 dark:text-white font-medium"
                                    />
                                    <div className="flex justify-end pr-1">
                                        <button type="button" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-wider transition-colors">Forgot password?</button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex gap-3 items-center animate-fade-in">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <p className="text-red-700 dark:text-red-400 text-xs font-bold">{error}</p>
                                    </div>
                                )}

                                <Button 
                                    type="submit" 
                                    className="w-full h-12 premium-btn text-white font-bold rounded-xl active:scale-[0.98] transition-all"
                                    size="lg"
                                    isLoading={isLoading}
                                    rightIcon={ChevronRight}
                                >
                                    Log in to Platform
                                </Button>
                            </form>

                            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
                                <DemoRoleSelector onSelect={handleDemoSelect} />
                            </div>
                        </Card>

                        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            All systems operational
                        </div>
                    </div>
                </div>
            </main>

            <LoginFooter />
        </div>
    );
}
