import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Animated number counter hook
const useCountUp = (target, duration = 1200) => {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start = Math.min(start + step, target);
            setValue(Math.floor(start));
            if (start >= target) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return value;
};

const severityConfig = {
    critical: {
        color: '#E11D48',
        glow: 'rgba(225,29,72,0.3)',
        border: 'rgba(225,29,72,0.25)',
        bg: 'rgba(225,29,72,0.06)',
        sparkColor: '#E11D48',
        dot: 'bg-rose-500',
        shadow: '0 0 20px rgba(225,29,72,0.2)',
    },
    high: {
        color: '#F59E0B',
        glow: 'rgba(245,158,11,0.3)',
        border: 'rgba(245,158,11,0.25)',
        bg: 'rgba(245,158,11,0.06)',
        sparkColor: '#F59E0B',
        dot: 'bg-amber-500',
        shadow: '0 0 20px rgba(245,158,11,0.2)',
    },
    medium: {
        color: '#3B82F6',
        glow: 'rgba(59,130,246,0.3)',
        border: 'rgba(59,130,246,0.25)',
        bg: 'rgba(59,130,246,0.06)',
        sparkColor: '#3B82F6',
        dot: 'bg-blue-500',
        shadow: '0 0 20px rgba(59,130,246,0.2)',
    },
    success: {
        color: '#10B981',
        glow: 'rgba(16,185,129,0.3)',
        border: 'rgba(16,185,129,0.25)',
        bg: 'rgba(16,185,129,0.06)',
        sparkColor: '#10B981',
        dot: 'bg-emerald-500',
        shadow: '0 0 20px rgba(16,185,129,0.2)',
    },
    blue: {
        color: '#2563EB',
        glow: 'rgba(37,99,235,0.3)',
        border: 'rgba(37,99,235,0.25)',
        bg: 'rgba(37,99,235,0.06)',
        sparkColor: '#2563EB',
        dot: 'bg-blue-600',
        shadow: '0 0 20px rgba(37,99,235,0.2)',
    }
};

const LiveKPICard = ({
    label,
    value,
    unit = '',
    sublabel,
    delta,
    deltaPositive = true,
    severity = 'blue',
    sparkData,
    icon: Icon,
    delay = 0,
}) => {
    const animatedValue = useCountUp(typeof value === 'number' ? value : 0, 1500);
    const cfg = severityConfig[severity] || severityConfig.blue;
    const displayValue = typeof value === 'number' ? animatedValue.toLocaleString() : value;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden group cursor-default"
            style={{
                background: `rgba(10,10,12,0.6)`,
                backdropFilter: 'blur(40px)',
                border: `1px solid ${cfg.border}`,
                boxShadow: `${cfg.shadow}, 0 25px 50px -12px rgba(0,0,0,0.8)`,
            }}
            whileHover={{ y: -4, transition: { duration: 0.3 } }}
        >
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}40, transparent)` }} />

            {/* Severity glow bg */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(ellipse at top left, ${cfg.bg} 0%, transparent 60%)` }} />

            <div className="relative z-10 p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {/* Live pulse dot */}
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] font-mono"
                            style={{ color: cfg.color }}>
                            {label}
                        </span>
                    </div>
                    {Icon && (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-3xl font-black text-white leading-none font-plus-jakarta tracking-tight">
                        {displayValue}
                    </span>
                    {unit && <span className="text-sm font-bold text-white/40 mb-0.5">{unit}</span>}
                </div>

                {/* Sublabel + delta */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-white/30 font-medium">{sublabel}</span>
                    {delta && (
                        <span className={`text-[10px] font-black font-mono ${deltaPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {deltaPositive ? '↑' : '↓'} {delta}
                        </span>
                    )}
                </div>

                {/* Sparkline */}
                {sparkData && (
                    <div className="h-12 w-full -mx-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`grad-${severity}-${label}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={cfg.sparkColor} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={cfg.sparkColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="v"
                                    stroke={cfg.sparkColor}
                                    strokeWidth={1.5}
                                    fill={`url(#grad-${severity}-${label})`}
                                    dot={false}
                                    activeDot={false}
                                />
                                <Tooltip
                                    contentStyle={{ display: 'none' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default LiveKPICard;
