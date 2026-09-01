import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Search,
    Bell,
    ChevronDown,
    Globe,
    Command,
    Zap,
    Cpu
} from 'lucide-react';

/**
 * The Noir: Enterprise Top Navigation
 * Features: Environment Selector, AI Search, and Profile Identity.
 */
const SentinelTopNav = () => {
    return (
        <header className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-[#020204]/80 backdrop-blur-2xl z-[100] px-8 flex items-center justify-between">
            {/* Left: Brand & Search */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold tracking-tight leading-none text-white font-plus-jakarta uppercase italic">
                            THE NOIR
                        </h1>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Autonomous Defense</p>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-white/5 mx-2" />

                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search incidents, assets, or playbooks..."
                        className="bg-white/5 border border-white/5 rounded-full py-2.5 pl-11 pr-16 text-[11px] w-[400px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-white/20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 text-[9px] font-bold text-white/20 flex items-center gap-1">
                        <Command className="w-2.5 h-2.5" />
                        <span>K</span>
                    </div>
                </div>
            </div>

            {/* Right: Environment & User */}
            <div className="flex items-center gap-6">
                {/* Environment Selector */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white bg-white/10 shadow-lg">Production</button>
                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors">Staging</button>
                </div>

                <div className="h-6 w-[1px] bg-white/5" />

                {/* Notifications & System Health */}
                <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors relative group">
                        <Bell className="w-4 h-4 text-white/40 group-hover:text-white" />
                        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#020204]" />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                        <Zap className="w-4 h-4 text-white/40 group-hover:text-blue-400" />
                    </button>
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[11px] font-bold text-white tracking-tight">Alex Sterling</span>
                        <span className="text-[9px] text-white/30 font-black uppercase tracking-widest leading-none">Senior Architect</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px]">
                        <div className="w-full h-full rounded-[11px] bg-[#020204] overflow-hidden flex items-center justify-center border border-white/10">
                            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex" alt="Avatar" className="w-8 h-8 opacity-80" />
                        </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-white/20 group-hover:text-white transition-colors" />
                </div>
            </div>
        </header>
    );
};

export default SentinelTopNav;
