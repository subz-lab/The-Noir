import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Globe, Server, User } from 'lucide-react';

const LiveAttackStream = () => {
    const [events, setEvents] = useState([]);
    const scrollRef = useRef(null);

    // Mock data generation
    useEffect(() => {
        const types = [
            { id: 'ddos', label: 'DDoS Vector', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
            { id: 'scan', label: 'Neural Scan', icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
            { id: 'auth', label: 'Auth Bypass', icon: User, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { id: 'infra', label: 'Node Payload', icon: Server, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
        ];

        const interval = setInterval(() => {
            const type = types[Math.floor(Math.random() * types.length)];
            const newEvent = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                vector: `VECTOR-${Math.floor(Math.random() * 9999)}`,
                timestamp: new Date().toLocaleTimeString(),
                cve: `CVE-2026-${Math.floor(Math.random() * 9999)}`
            };
            setEvents(prev => [newEvent, ...prev].slice(0, 20));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-deep rounded-[2.5rem] p-10 flex flex-col h-[500px]"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                        <Activity className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight uppercase">Live Incursion Stream</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black italic">Monitoring Global Vector Flux</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-black">Velocity: 42.4 req/s</span>
                    <div className="w-12 h-6 bg-white/5 rounded-full p-1 flex items-center">
                        <motion.div
                            animate={{ x: [0, 24, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 hide-scrollbar">
                <AnimatePresence initial={false}>
                    {events.map((ev) => (
                        <motion.div
                            key={ev.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.03)' }}
                            className="group flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] transition-all cursor-crosshair"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${ev.type.bg} ${ev.type.border} flex items-center justify-center`}>
                                    <ev.type.icon className={`w-4 h-4 ${ev.type.color}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[11px] font-bold text-white tracking-tight uppercase">{ev.type.label}</p>
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${ev.type.bg} ${ev.type.color} border ${ev.type.border} uppercase`}>
                                            {ev.cve}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-white/30 font-mono tracking-tighter mt-0.5">Origin ID: {ev.ip} • Vector: {ev.vector}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-white font-mono font-bold tracking-tight">{ev.timestamp}</p>
                                <p className="text-[8px] text-white/10 font-black uppercase tracking-widest mt-0.5">Confidence 98.4%</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black group-hover:text-rose-500 transition-colors">
                    Awaiting encrypted stream payloads...
                </span>
            </div>
        </motion.div>
    );
};

export default LiveAttackStream;
