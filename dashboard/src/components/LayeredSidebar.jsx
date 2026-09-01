import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ShieldAlert,
    Fingerprint,
    Zap,
    HardDrive,
    FileText,
    Settings,
    ChevronRight,
    Target
} from 'lucide-react';

const LayeredSidebar = ({ active = 'dashboard', onChange }) => {
    const modules = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
        { id: 'incidents', icon: ShieldAlert, label: 'Incidents' },
        { id: 'threat-intel', icon: Fingerprint, label: 'Threat Intel' },
        { id: 'soar', icon: Zap, label: 'SOAR' },
        { id: 'logs', icon: HardDrive, label: 'Logs' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'simulate', icon: Target, label: 'Attack Simulator' },
    ];

    return (
        <aside className="fixed top-0 left-0 h-screen w-72 bg-[#020204]/60 backdrop-blur-2xl border-r border-white/5 z-50 pt-24 pb-8 px-6 flex flex-col">
            {/* Environment Label */}
            <div className="mb-10 px-4">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Workspace</span>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Series-A Dev</span>
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Main Security Ops</h3>
                </div>
            </div>

            {/* Module Navigation */}
            <div className="flex-1 space-y-2">
                {modules.map((module) => (
                    <button
                        key={module.id}
                        onClick={() => onChange(module.id)}
                        className={`w-full group relative mb-1 ${active === module.id ? 'nav-btn-active' : 'nav-btn'}`}
                    >
                        <module.icon className={`w-4 h-4 ${active === module.id ? 'text-blue-500' : 'text-white/20 group-hover:text-white/60'}`} />
                        <span className="font-semibold text-[13px]">{module.label}</span>
                        {active === module.id && (
                            <motion.div
                                layoutId="active-nav"
                                className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_#3b82f6]"
                            />
                        )}
                        <ChevronRight className={`ml-auto w-3.5 h-3.5 transition-transform duration-300 ${active === module.id ? 'opacity-100 rotate-90 text-blue-500' : 'opacity-0 group-hover:opacity-40 group-hover:translate-x-1'}`} />
                    </button>
                ))}
            </div>

            {/* Bottom: Settings & System Status */}
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
                            animate={{ width: "95%" }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default LayeredSidebar;
