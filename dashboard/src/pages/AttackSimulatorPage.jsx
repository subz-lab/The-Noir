import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, RefreshCcw, CheckCircle, XCircle, ShieldCheck, Cpu, Brain } from 'lucide-react';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import PageHeader from '../components/PageHeader';
import AgentActivityFeed from '../components/AgentActivityFeed';
import { bulkIngestLogs, ATTACK_PRESETS, fetchActionHistory } from '../api';

const getSeverityColor = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
};

const AttackSimulatorPage = () => {
    const [selected, setSelected] = useState('brute_force');
    const [status, setStatus] = useState('idle'); // idle | running | done | error
    const [result, setResult] = useState(null);
    const [progress, setProgress] = useState(0);
    const [actionHistory, setActionHistory] = useState([]);
    const [initialHistoryCount, setInitialHistoryCount] = useState(0);

    // Initial load and polling for SOAR actions
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const hist = await fetchActionHistory(20);
                setActionHistory(hist);
                if (initialHistoryCount === 0 && hist.length > 0) {
                     setInitialHistoryCount(hist.length);
                }
            } catch (e) {
                // silent
            }
        };
        loadHistory();
        const interval = setInterval(loadHistory, 3000);
        return () => clearInterval(interval);
    }, [initialHistoryCount]);

    const runAttack = async () => {
        setStatus('running');
        setResult(null);
        setProgress(30);

        const preset = ATTACK_PRESETS[selected];

        try {
            setProgress(60);
            const res = await bulkIngestLogs(preset.logs);
            setProgress(100);
            setResult(res.last_analysis);
            setStatus('done');
            
            // Set current history count so we can highlight new actions
            setInitialHistoryCount(actionHistory.length);
        } catch (e) {
            setStatus('error');
            setResult({ error: e.message });
        }
    };

    // Filter only actions that occurred recently if we just ran an attack
    const recentActions = actionHistory.slice(0, Math.max(0, actionHistory.length - initialHistoryCount) || 5);

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <PageHeader
                icon={Target}
                iconColor="#F59E0B"
                title="Attack Simulator"
                subtitle="Inject synthetic attack vectors · Test ML classification · Trigger SOAR"
            />

            <SentinelGrid className="mb-0">
                <SentinelSection id="attack-vectors" colSpan="col-span-12" title="Select Attack Vector Preset">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
                        {Object.entries(ATTACK_PRESETS).map(([key, preset]) => (
                            <button
                                key={key}
                                onClick={() => { setSelected(key); setStatus('idle'); setResult(null); }}
                                className={`p-6 rounded-2xl text-left border transition-all ${selected === key
                                    ? 'bg-gradient-to-br from-white to-white/90 border-transparent text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/25 text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2.5 rounded-xl ${selected === key ? 'bg-black/10' : 'bg-orange-500/10'}`}>
                                        <Zap className={`w-5 h-5 ${selected === key ? 'text-black' : 'text-orange-400'}`} />
                                    </div>
                                    <span className="font-black text-base uppercase tracking-tight">{preset.label}</span>
                                </div>
                                <p className={`text-xs leading-relaxed ${selected === key ? 'text-black/70' : 'text-white/40'}`}>
                                    {preset.description}
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${selected === key ? 'bg-black/10 text-black/70' : 'bg-white/10 text-white/50'}`}>
                                        {preset.logs.length} Log Payloads
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </SentinelSection>
            </SentinelGrid>

            {/* Launch & Telemetry & Multi-Agent Collaboration */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left: Execution & Telemetry Result */}
                <div className="col-span-12 lg:col-span-7">
                    <SentinelGrid>
                        <SentinelSection id="execution-panel" colSpan="col-span-12" title="Attack Execution & Pipeline Telemetry">
                            <div className="flex flex-col gap-5 p-2">
                                <button
                                    onClick={runAttack}
                                    disabled={status === 'running'}
                                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black uppercase tracking-widest text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                                >
                                    {status === 'running' ? (
                                        <>
                                            <RefreshCcw className="w-5 h-5 animate-spin" />
                                            Simulating Pipeline Execution...
                                        </>
                                    ) : (
                                        <>
                                            <Target className="w-5 h-5" />
                                            Launch Attack Simulation
                                        </>
                                    )}
                                </button>

                                {status === 'running' && (
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-orange-400 rounded-full"
                                            transition={{ duration: 0.2 }}
                                        />
                                    </div>
                                )}

                                <AnimatePresence>
                                    {result && status === 'done' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-5"
                                        >
                                            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-3">
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                <span className="font-black text-emerald-400 uppercase tracking-widest text-xs">
                                                    Neural Classification & Orchestration Complete
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-4 rounded-xl bg-[#020204]/60 border border-white/5">
                                                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Classification</p>
                                                    <p className={`text-xl font-black ${getSeverityColor(result.label).split(' ')[0]}`}>{result.label || 'Unknown'}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-[#020204]/60 border border-white/5">
                                                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">AI Confidence</p>
                                                    <p className="text-xl font-black text-white">{((result.confidence || 0) * 100).toFixed(1)}%</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-[#020204]/60 border border-white/5">
                                                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Severity Index</p>
                                                    <p className="text-xl font-black text-white">{result.severity_index ?? '—'} <span className="text-xs text-white/30">/ 2</span></p>
                                                </div>
                                            </div>
                                            {result.features && (
                                                <div className="pt-4 border-t border-emerald-500/10">
                                                    <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Extracted Feature Vectors</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(result.features).map(([k, v]) => (
                                                            <div key={k} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg border border-white/5">
                                                                <span className="text-white/40 font-mono text-[10px] truncate">{k.replace(/_/g, ' ')}</span>
                                                                <span className="text-white/90 font-mono text-xs font-bold">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {status === 'error' && result?.error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-3"
                                        >
                                            <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-rose-400">Simulation Error</p>
                                                <p className="text-xs text-rose-400/70 mt-1">{result.error}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </SentinelSection>
                    </SentinelGrid>
                </div>

                {/* Right: Real-time Multi-Agent Activity Feed (GAP C) + Live SOAR Responses */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    {/* Live Agent Collaboration Feed */}
                    <SentinelGrid>
                        <SentinelSection id="agent-activity-feed" colSpan="col-span-12" title="Collaborative Multi-Agent Flow">
                            <div className="h-[280px]">
                                <AgentActivityFeed isRunning={status === 'running'} />
                            </div>
                        </SentinelSection>
                    </SentinelGrid>

                    {/* Live SOAR Execution Log */}
                    <SentinelGrid>
                        <SentinelSection id="live-soar-responses" colSpan="col-span-12" title="Automated SOAR Execution">
                            <div className="h-[240px] overflow-y-auto pr-1 hide-scrollbar p-1">
                                {recentActions.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-center text-white/20 flex-col gap-2">
                                        <ShieldCheck className="w-7 h-7 text-white/10" />
                                        <span className="text-xs font-mono">Standing by. Playbooks auto-execute on high threat scores.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {recentActions.map((log) => (
                                                <motion.div 
                                                    key={log.id} 
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5"
                                                >
                                                    <div className="p-1 rounded-lg bg-emerald-500/20 mt-0.5">
                                                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider block">{log.action_type?.replace(/_/g, ' ')}</span>
                                                        <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5 truncate">{log.details}</p>
                                                    </div>
                                                    <span className="text-[8px] text-white/30 font-mono flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </SentinelSection>
                    </SentinelGrid>
                </div>
            </div>
        </div>
    );
};

export default AttackSimulatorPage;
