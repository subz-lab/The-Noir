import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Shield, ChevronDown } from 'lucide-react';
import MagneticButton from './MagneticButton';

const FloatingHeader = () => {
    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] z-50 px-8 py-4 glass-premium rounded-[2rem] flex items-center justify-between"
        >
            {/* Logo Section */}
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Shield className="w-6 h-6 text-black" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold font-grotesk tracking-tighter text-white uppercase italic leading-none">THE NOIR</span>
                    <span className="text-[10px] text-white/30 tracking-[0.3em] font-black uppercase">Automation Suite</span>
                </div>
            </div>

            {/* Global Search */}
            <div className="relative w-96 group">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                <input
                    type="text"
                    placeholder="Ask AI or search threat vectors..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all text-white placeholder:text-white/20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/30">
                    <span className="text-[8px]">⌘</span>K
                </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Threat Level: High</span>
                </div>

                <div className="h-8 w-[1px] bg-white/5" />

                <div className="flex items-center gap-4">
                    <MagneticButton className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative">
                        <Bell className="w-5 h-5 text-white/60" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
                    </MagneticButton>

                    <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                        <div className="text-right flex flex-col justify-center">
                            <p className="text-xs font-bold text-white tracking-tight leading-none mb-1">V. Pednekar</p>
                            <p className="text-[9px] text-emerald-400 font-mono leading-none">L4 ARCHITECT</p>
                        </div>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center font-black text-sm relative overflow-hidden">
                                <Shield className="w-5 h-5 text-white/60" />
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#020203]">
                                <ChevronDown className="w-3 h-3 text-white/40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default FloatingHeader;
