import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, RefreshCcw, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
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
                console.error("Failed to load SOAR history", e);
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
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white font-grotesk tracking-tight">Attack Simulator</h2>
                    <p className="text-sm text-white/40">Inject synthetic attack vectors to test neural network classification and SOAR responses</p>
                </div>
            </div>

            <SentinelGrid className="mb-8">
                <SentinelSection id="attack-vectors" colSpan="col-span-12" title="Select Attack Vector">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                        {Object.entries(ATTACK_PRESETS).map(([key, preset]) => (
                            <button
                                key={key}
                                onClick={() => { setSelected(key); setStatus('idle'); setResult(null); }}
                                className={`p-8 rounded-3xl text-left border transition-all ${selected === key
                                    ? 'bg-gradient-to-br from-white to-white/90 border-transparent text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-2xl ${selected === key ? 'bg-black/10' : 'bg-orange-500/10'}`}>
                                        <Zap className={`w-6 h-6 ${selected === key ? 'text-black' : 'text-orange-400'}`} />
                                    </div>
                                    <span className="font-black text-lg uppercase tracking-tight">{preset.label}</span>
                                </div>
                                <p className={`text-sm leading-relaxed ${selected === key ? 'text-black/60' : 'text-white/40'}`}>
                                    {preset.description}
                                </p>
                                <div className="mt-6 flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${selected === key ? 'bg-black/10 text-black/60' : 'bg-white/10 text-white/50'}`}>
                                        {preset.logs.length} Log Payload
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </SentinelSection>
            </SentinelGrid>

            <SentinelGrid>
                <SentinelSection id="execution-panel" colSpan="col-span-12 lg:col-span-8" title="Execution & Telemetry Result">
                    <div className="flex flex-col gap-6 p-2">
                        {/* Run Button */}
                        <button
                            onClick={runAttack}
                            disabled={status === 'running'}
                            className="w-full py-6 rounded-[2rem] bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black uppercase tracking-widest text-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(249,115,22,0.3)]"
                        >
                            {status === 'running' ? (
                                <>
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                    Injecting Payload... {progress}%
                                </>
                            ) : (
                                <>
                                    <Target className="w-5 h-5" />
                                    Launch Neural Attack
                                </>
                            )}
                        </button>

                        {/* Progress Bar */}
                        {status === 'running' && (
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-orange-400 rounded-full"
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                        )}

                        {/* Result Panel */}
                        <AnimatePresence>
                            {result && status === 'done' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-8 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 space-y-6"
                                >
                                    <div className="flex items-center gap-4 border-b border-emerald-500/20 pb-4">
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        <span className="font-black text-emerald-400 uppercase tracking-widest text-sm">Response Received / Neural Defense Engaged</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-2xl bg-[#020204]/50 border border-white/5">
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Classification</p>
                                            <p className={`text-3xl font-black ${getSeverityColor(result.label).split(' ')[0]}`}>{result.label || 'Unknown'}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-[#020204]/50 border border-white/5">
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">AI Confidence</p>
                                            <p className="text-3xl font-black text-white">{((result.confidence || 0) * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-[#020204]/50 border border-white/5">
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Severity Index</p>
                                            <p className="text-3xl font-black text-white">{result.severity_index ?? '—'} <span className="text-lg text-white/30">/ 2</span></p>
                                        </div>
                                    </div>
                                    {result.features && (
                                        <div className="pt-6 border-t border-emerald-500/10">
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                {Object.entries(result.features).map(([k, v]) => (
                                                    <div key={k} className="flex flex-col justify-between py-2 px-4 bg-white/5 rounded-xl border border-white/5">
                                                        <span className="text-white/40 font-mono text-xs truncate" title={k}>{k.replace(/_/g, ' ')}</span>
                                                        <span className="text-white/90 font-bold mt-1">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
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
                                    className="mt-4 p-8 rounded-[2rem] border border-rose-500/20 bg-rose-500/10 flex items-start gap-4"
                                >
                                    <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-lg font-bold text-rose-400">Simulation Failed</p>
                                        <p className="text-sm text-rose-400/60 mt-2">{result.error}</p>
                                        <p className="text-xs text-white/40 mt-4 leading-relaxed max-w-lg">Make sure the FastAPI backend is running and the ML endpoint is active.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </SentinelSection>

                <SentinelSection id="live-soar-responses" colSpan="col-span-12 lg:col-span-4" title="Live SOAR Responses">
                     <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
                         {status === 'idle' && recentActions.length === 0 ? (
                             <div className="flex h-full items-center justify-center text-center text-white/30 flex-col gap-3">
                                <ShieldCheck className="w-8 h-8 text-white/20" />
                                <span className="text-sm">Standing by for attacks.<br/>SOAR playbooks will execute automatically if triggered.</span>
                             </div>
                         ) : recentActions.length === 0 ? (
                              <div className="flex h-full items-center justify-center text-center text-white/30">
                                <span className="text-sm">No SOAR actions triggered by recent simulation. (Ensure active playbooks match the generated threat).</span>
                             </div>
                         ) : (
                             <div className="space-y-3">
                                 <AnimatePresence>
                                     {recentActions.map((log) => (
                                         <motion.div 
                                            key={log.id} 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
                                        >
                                             <div className="flex items-center gap-3 mb-2">
                                                 <div className="p-1.5 rounded-lg bg-emerald-500/20">
                                                     <Zap className="w-4 h-4 text-emerald-400" />
                                                 </div>
                                                 <span className="text-xs font-bold text-white uppercase tracking-widest">{log.action_type.replace('_', ' ')}</span>
                                             </div>
                                             <p className="text-xs text-emerald-400/80 leading-relaxed font-mono">
                                                 {log.details}
                                             </p>
                                             <div className="mt-3 text-[10px] text-white/40 text-right italic border-t border-emerald-500/10 pt-2">
                                                 {new Date(log.timestamp).toLocaleTimeString()}
                                             </div>
                                         </motion.div>
                                     ))}
                                 </AnimatePresence>
                             </div>
                         )}
                     </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default AttackSimulatorPage;
