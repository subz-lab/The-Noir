import React from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Bell, Activity, User, Command } from 'lucide-react';

const EliteCommandBar = () => {
    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[var(--z-layer-max)] w-[90%] max-w-[1400px]"
        >
            <div className="glass-premium rounded-[3rem] px-10 py-5 flex items-center justify-between border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] glow-edge-blue ring-1 ring-white/5">

                {/* Logo & Status */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-500">
                            <Shield className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tighter font-grotesk leading-none">THE NOIR</h1>
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-black mt-1">Automation Suite</p>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 mx-2" />

                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Global Alert: High</span>
                    </div>
                </div>

                {/* AI Search Bar */}
                <div className="flex-1 max-w-xl mx-12">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Ask AI or search threat vectors..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-14 pr-16 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white/[0.08] transition-all"
                        />
                        <div className="absolute inset-y-0 right-4 flex items-center gap-1.5">
                            <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1">
                                <Command className="w-3 h-3 text-white/30" />
                                <span className="text-[9px] font-black text-white/30">K</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Actions */}
                <div className="flex items-center gap-4">
                    <button className="relative w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group">
                        <Activity className="w-4 h-4 text-white/60 group-hover:text-emerald-400" />
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                    </button>

                    <button className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Bell className="w-4 h-4 text-white/60" />
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 mx-2" />

                    <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-white tracking-tight">V. PEDNEKAR</p>
                            <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">Admin</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-[1px]">
                            <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden">
                                <User className="w-5 h-5 text-white/60" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default EliteCommandBar;
