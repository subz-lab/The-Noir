import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, ShieldAlert, Fingerprint, Zap,
    HardDrive, FileText, Settings, ChevronRight, Target
} from 'lucide-react';

// Module pulse config
const modulePulse = {
    incidents: { color: '#E11D48', animate: true },       // red - critical
    soar: { color: '#10B981', animate: true },             // green - active
    'threat-intel': { color: '#F59E0B', animate: false },  // amber - monitoring
    dashboard: { color: '#2563EB', animate: false },       // blue - active page
};

const LayeredSidebar = ({ active = 'dashboard', onChange, incidentCount = 0 }) => {
    const modules = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
        { id: 'incidents', icon: ShieldAlert, label: 'Incidents', count: incidentCount },
        { id: 'threat-intel', icon: Fingerprint, label: 'Threat Intel' },
        { id: 'soar', icon: Zap, label: 'SOAR' },
        { id: 'logs', icon: HardDrive, label: 'Logs' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'simulate', icon: Target, label: 'Attack Simulator' },
    ];

    return (
        <aside className="fixed top-0 left-0 h-screen w-72 bg-[#020204]/60 backdrop-blur-2xl border-r border-white/5 z-50 pt-24 pb-8 px-6 flex flex-col">

            {/* Workspace card */}
            <div className="mb-8 px-4">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Workspace</span>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">SIH 2026</span>
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Main Security Ops</h3>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 space-y-1">
                {modules.map((module) => {
                    const isActive = active === module.id;
                    const pulse = modulePulse[module.id];

                    return (
                        <button
                            key={module.id}
                            onClick={() => onChange(module.id)}
                            className={`w-full group relative ${isActive ? 'nav-btn-active' : 'nav-btn'}`}
                        >
                            {/* Active left bar */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                                    style={{ background: '#2563EB', boxShadow: '0 0 15px #3b82f6' }}
                                />
                            )}

                            <module.icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-white/20 group-hover:text-white/60'}`} />
                            <span className="font-semibold text-[13px] flex-1 text-left">{module.label}</span>

                            {/* Count badge */}
                            {module.count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/20">
                                    {module.count}
                                </span>
                            )}

                            {/* Live pulse indicator */}
                            {pulse && !isActive && (
                                <span className="relative flex h-1.5 w-1.5 ml-auto">
                                    {pulse.animate && (
                                        <span
                                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                                            style={{ background: pulse.color }}
                                        />
                                    )}
                                    <span
                                        className="relative inline-flex rounded-full h-1.5 w-1.5"
                                        style={{ background: pulse.color }}
                                    />
                                </span>
                            )}

                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'opacity-100 rotate-90 text-blue-500' : 'opacity-0 group-hover:opacity-40 group-hover:translate-x-1'}`} />
                        </button>
                    );
                })}
            </div>

            {/* Bottom: Settings + Health */}
            <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
                <button
                    onClick={() => onChange('settings')}
                    className={`w-full ${active === 'settings' ? 'nav-btn-active' : 'nav-btn'}`}
                >
                    <Settings className="w-4 h-4" />
                    <span className="font-semibold text-[13px]">Settings</span>
                </button>

                <div className="px-4 py-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Platform Health</p>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-white/60">Node Grid</span>
                        <span className="text-[11px] font-bold text-emerald-400">99%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '95%' }}
                            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default LayeredSidebar;
