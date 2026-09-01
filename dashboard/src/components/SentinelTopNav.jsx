import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, Search, Bell, ChevronDown, Command, Zap
} from 'lucide-react';
import ThreatLevelBanner from './ThreatLevelBanner';

/**
 * The Noir: SIH-Level Top Navigation
 * Features: Live UTC clock, threat level banner, notification count, user identity.
 */
const SentinelTopNav = ({ incidentCount = 0, alertCount = 0 }) => {
    const [time, setTime] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const h = String(now.getUTCHours()).padStart(2, '0');
            const m = String(now.getUTCMinutes()).padStart(2, '0');
            const s = String(now.getUTCSeconds()).padStart(2, '0');
            setTime(`${h}:${m}:${s}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-[#020204]/80 backdrop-blur-2xl z-[100] px-8 flex items-center justify-between">
            {/* Left: Brand */}
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

                {/* Search */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search incidents, assets, playbooks..."
                        className="bg-white/5 border border-white/5 rounded-full py-2.5 pl-11 pr-16 text-[11px] w-[360px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-white/20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 text-[9px] font-bold text-white/20 flex items-center gap-1">
                        <Command className="w-2.5 h-2.5" /><span>K</span>
                    </div>
                </div>
            </div>

            {/* Center: Live clock + Threat Level */}
            <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
                {/* Live clock */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-400/80 tracking-widest">
                        {time}
                    </span>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-wider font-mono">UTC</span>
                </div>

                <div className="h-4 w-[1px] bg-white/10" />

                {/* Threat level banner */}
                <ThreatLevelBanner incidentCount={incidentCount} />
            </div>

            {/* Right: Controls + User */}
            <div className="flex items-center gap-5">
                {/* Live LLM Provider Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-[9px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    <span className="font-bold text-white/80 uppercase tracking-wider">Groq</span>
                    <span className="text-white/30">·</span>
                    <span className="text-emerald-400/90 font-medium">groq/compound</span>
                </div>

                <div className="h-6 w-[1px] bg-white/5" />

                {/* Notifications */}
                <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors relative group">
                        <Bell className="w-4 h-4 text-white/40 group-hover:text-white" />
                        {alertCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full border border-[#020204] flex items-center justify-center"
                            >
                                <span className="text-[7px] font-black text-white">{alertCount > 9 ? '9+' : alertCount}</span>
                            </motion.div>
                        )}
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                        <Zap className="w-4 h-4 text-white/40 group-hover:text-blue-400" />
                    </button>
                </div>

                {/* User */}
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
