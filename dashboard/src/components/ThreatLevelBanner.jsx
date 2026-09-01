import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

const levels = {
    NOMINAL: {
        label: 'SYSTEM NOMINAL',
        color: '#10B981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.2)',
        glow: 'rgba(16,185,129,0.15)',
        icon: ShieldCheck,
        pulse: 'bg-emerald-500',
    },
    ELEVATED: {
        label: 'THREAT ELEVATED',
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.2)',
        glow: 'rgba(245,158,11,0.15)',
        icon: AlertTriangle,
        pulse: 'bg-amber-500',
    },
    CRITICAL: {
        label: 'CRITICAL ALERT',
        color: '#E11D48',
        bg: 'rgba(225,29,72,0.1)',
        border: 'rgba(225,29,72,0.25)',
        glow: 'rgba(225,29,72,0.2)',
        icon: ShieldAlert,
        pulse: 'bg-rose-500',
    },
};

const ThreatLevelBanner = ({ incidentCount = 0 }) => {
    const level = incidentCount >= 5 ? 'CRITICAL' : incidentCount >= 2 ? 'ELEVATED' : 'NOMINAL';
    const cfg = levels[level];
    const Icon = cfg.icon;

    const [time, setTime] = useState('');
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toUTCString().slice(17, 25) + ' UTC');
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={level}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl"
                style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    boxShadow: `0 0 20px ${cfg.glow}`,
                }}
            >
                {/* Pulse dot */}
                <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${cfg.pulse}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.pulse}`} />
                </span>

                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />

                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono" style={{ color: cfg.color }}>
                    {cfg.label}
                </span>

                <div className="w-[1px] h-3 bg-white/10 mx-1" />

                <span className="text-[10px] font-mono font-bold text-white/40">
                    {time}
                </span>
            </motion.div>
        </AnimatePresence>
    );
};

export default ThreatLevelBanner;
