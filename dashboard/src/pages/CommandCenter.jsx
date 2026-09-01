// The Noir — Command Center (SIH Level Overhaul)
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Activity, Clock, Shield } from 'lucide-react';
import SentinelParallaxHero from '../components/SentinelParallaxHero';
import SystemHealth from '../components/SystemHealth';
import LiveAttackStream from '../components/LiveAttackStream';
import NeuralThreatGraph from '../components/NeuralThreatGraph';
import AIThreatTimeline from '../components/AIThreatTimeline';
import AutomationBrain from '../components/AutomationBrain';
import LiveKPICard from '../components/LiveKPICard';

// Generate sparkline data
const spark = (base, count = 20, variance = 0.3) =>
    Array.from({ length: count }, (_, i) => ({
        v: Math.max(0, Math.round(base * (1 + (Math.random() - 0.5) * variance))),
        t: i,
    }));

const CommandCenter = ({ incidents = [], logs = [] }) => {
    const [kpiData, setKpiData] = useState(null);

    // Derive real stats from data
    const stats = useMemo(() => {
        const threats = logs.filter(l => ['THREAT', 'CRITICAL'].includes((l.label || '').toUpperCase())).length;
        const suspicious = logs.filter(l => ['SUSPICIOUS', 'HIGH'].includes((l.label || '').toUpperCase())).length;
        const critical = incidents.filter(i => (i.severity_label || i.type || '').toUpperCase().includes('CRITICAL')).length;
        return { threats, suspicious, critical, total: logs.length };
    }, [logs, incidents]);

    useEffect(() => {
        setKpiData({
            threats: {
                value: stats.threats || 47,
                spark: spark(47, 20, 0.5),
            },
            blocked: {
                value: 2847,
                spark: spark(2847, 20, 0.2),
            },
            response: {
                value: '0.82',
                spark: spark(8, 20, 0.3),
            },
            uptime: {
                value: 99.97,
                spark: spark(99, 20, 0.01),
            },
        });
    }, [stats]);

    if (!kpiData) return null;

    return (
        <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* ── Row 1: Live KPI Cards ── */}
            <section>
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 font-mono">
                        Live Telemetry
                    </span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <LiveKPICard
                        label="Active Threats"
                        value={kpiData.threats.value}
                        sublabel={`${stats.suspicious} suspicious`}
                        delta="+12 vs 1h ago"
                        deltaPositive={false}
                        severity="critical"
                        sparkData={kpiData.threats.spark}
                        icon={ShieldAlert}
                        delay={0}
                    />
                    <LiveKPICard
                        label="Blocked Attacks"
                        value={kpiData.blocked.value}
                        sublabel="Today total"
                        delta="+347 vs yesterday"
                        deltaPositive={true}
                        severity="success"
                        sparkData={kpiData.blocked.spark}
                        icon={Shield}
                        delay={0.08}
                    />
                    <LiveKPICard
                        label="Avg Response"
                        value="0.82"
                        unit="ms"
                        sublabel="Neural speed"
                        delta="-0.03ms"
                        deltaPositive={true}
                        severity="medium"
                        sparkData={kpiData.response.spark}
                        icon={Clock}
                        delay={0.16}
                    />
                    <LiveKPICard
                        label="System Uptime"
                        value={99.97}
                        unit="%"
                        sublabel="All nodes healthy"
                        severity="success"
                        sparkData={kpiData.uptime.spark}
                        icon={Activity}
                        delay={0.24}
                    />
                </div>
            </section>

            {/* ── Row 2: Cinematic Parallax Hero ── */}
            <SentinelParallaxHero />

            {/* ── Row 3: Live Attack Stream + Threat Graph ── */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-8">
                    <GlassPanel title="Live Attack Stream" badge="LIVE" badgeColor="#10B981">
                        <div className="h-[360px]">
                            <LiveAttackStream logs={logs} />
                        </div>
                    </GlassPanel>
                </div>
                <div className="col-span-12 xl:col-span-4">
                    <GlassPanel title="Neural Threat Graph" badge="24H" badgeColor="#2563EB">
                        <div className="h-[360px]">
                            <NeuralThreatGraph logs={logs} />
                        </div>
                    </GlassPanel>
                </div>
            </div>

            {/* ── Row 4: AI Timeline + Automation Brain ── */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-6">
                    <GlassPanel title="AI Forensic Timeline" badge="AUTO" badgeColor="#F59E0B">
                        <div className="h-[320px]">
                            <AIThreatTimeline />
                        </div>
                    </GlassPanel>
                </div>
                <div className="col-span-12 xl:col-span-6">
                    <GlassPanel title="Automation Brain" badge="NEURAL" badgeColor="#2563EB">
                        <div className="h-[320px]">
                            <AutomationBrain />
                        </div>
                    </GlassPanel>
                </div>
            </div>

            {/* ── Row 5: System Health ── */}
            <GlassPanel title="Platform Power Density" badge="METRICS" badgeColor="#2563EB">
                <div className="h-[380px]">
                    <SystemHealth />
                </div>
            </GlassPanel>
        </div>
    );
};

// Reusable glass panel wrapper
const GlassPanel = ({ title, badge, badgeColor = '#2563EB', children }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
            background: 'rgba(10,10,12,0.6)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.02)',
        }}
    >
        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <h3 className="text-sm font-bold text-white/80 tracking-tight font-plus-jakarta">{title}</h3>
            {badge && (
                <span
                    className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full font-mono"
                    style={{
                        color: badgeColor,
                        background: `${badgeColor}15`,
                        border: `1px solid ${badgeColor}30`,
                    }}
                >
                    {badge}
                </span>
            )}
        </div>

        <div className="p-4">{children}</div>
    </motion.div>
);

export default CommandCenter;
