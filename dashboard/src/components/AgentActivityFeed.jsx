import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Eye, Zap, FileText, ArrowRight, CheckCircle2, Cpu } from 'lucide-react';

const STEP_ICONS = {
    OBSERVE: Eye,
    THINK: Brain,
    ACT: Zap,
    REPORT: FileText,
    normalize_log: Cpu,
    ml_classify: Brain,
    feed_correlator: ArrowRight,
    correlate_events: Zap,
    score_severity: FileText,
    generate_report: FileText,
    trigger_soar: Zap,
    save_report: CheckCircle2,
};

const STEP_COLORS = {
    OBSERVE: '#6366F1',
    THINK: '#8B5CF6',
    ACT: '#F97316',
    REPORT: '#10B981',
    normalize_log: '#6366F1',
    ml_classify: '#8B5CF6',
    feed_correlator: '#2563EB',
    correlate_events: '#F97316',
    score_severity: '#EAB308',
    generate_report: '#10B981',
    trigger_soar: '#E11D48',
    save_report: '#10B981',
};

const AGENT_COLORS = {
    LogAnalysisAgent: '#6366F1',
    ThreatInvestigationAgent: '#E11D48',
};

/**
 * AgentActivityFeed — SIH GAP C
 *
 * Live panel that polls GET /api/agents/activity and displays
 * both agents' OBSERVE/THINK/ACT/REPORT steps as an animated feed.
 * Shows the full pipeline flow visually for SIH judges.
 */
const AgentActivityFeed = ({ isRunning = false }) => {
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const fetchActivity = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/agents/activity`);
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            // Merge both agents' logs into one timeline
            const all = [
                ...(data.log_analysis_agent || []).map(e => ({ ...e, agent: 'LogAnalysisAgent' })),
                ...(data.threat_investigation_agent || []).map(e => ({ ...e, agent: 'ThreatInvestigationAgent' })),
            ];
            // Sort by timestamp descending, keep last 30
            all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            setActivities(all.slice(0, 30));
            setError(null);
        } catch (e) {
            setError('Agents offline');
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, isRunning ? 1500 : 4000);
        return () => clearInterval(interval);
    }, [isRunning]);

    // Auto-scroll to top on new activity
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [activities.length]);

    const fmtTime = (ts) => {
        try { return new Date(ts).toLocaleTimeString([], { hour12: false }); } catch { return '—'; }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {isRunning && (
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shadow-[0_0_8px_#fb923c]" />
                    )}
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] font-mono">
                        {isRunning ? 'Pipeline Active' : 'Agent Activity'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="text-[8px] text-white/20 font-mono">Log Agent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[8px] text-white/20 font-mono">Threat Agent</span>
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar space-y-1.5 pr-1">
                {error ? (
                    <div className="flex items-center justify-center h-full text-white/20 text-[11px] font-mono">
                        {error}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <Brain className="w-10 h-10 text-white/10" />
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                            Launch a simulation to<br />activate the agents
                        </p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {activities.map((activity, i) => {
                            const step = activity.step || activity.action || 'ACT';
                            const Icon = STEP_ICONS[step] || Zap;
                            const color = STEP_COLORS[step] || '#6B7280';
                            const agentColor = AGENT_COLORS[activity.agent] || '#6B7280';
                            return (
                                <motion.div
                                    key={`${activity.agent}-${activity.timestamp}-${i}`}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                >
                                    {/* Step icon */}
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                                        <Icon className="w-3 h-3" style={{ color }} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Step + agent */}
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>
                                                {step}
                                            </span>
                                            <span className="text-[8px] text-white/20">·</span>
                                            <span className="text-[8px] font-bold truncate" style={{ color: agentColor, opacity: 0.7 }}>
                                                {activity.agent === 'LogAnalysisAgent' ? 'LOG AGENT' : 'THREAT AGENT'}
                                            </span>
                                        </div>
                                        {/* Details */}
                                        {activity.details && (
                                            <p className="text-[10px] text-white/40 font-mono truncate">
                                                {typeof activity.details === 'string'
                                                    ? activity.details
                                                    : JSON.stringify(activity.details).slice(0, 80)}
                                            </p>
                                        )}
                                        {activity.data && !activity.details && (
                                            <p className="text-[10px] text-white/30 font-mono truncate">
                                                {JSON.stringify(activity.data).slice(0, 80)}
                                            </p>
                                        )}
                                    </div>

                                    <span className="text-[8px] font-mono text-white/15 flex-shrink-0 mt-0.5">
                                        {fmtTime(activity.timestamp)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default AgentActivityFeed;
