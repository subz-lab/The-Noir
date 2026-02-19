import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, AlertTriangle, Activity, LayoutDashboard, FileText,
    Search, Bell, RefreshCcw, Cpu, X, PlusCircle, Zap,
    ChevronRight, Database, TrendingUp, CheckCircle, XCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import GlassCard from './components/GlassCard';
import MagneticButton from './components/MagneticButton';
import Skeleton from './components/Skeleton';
import ThreatMap from './components/ThreatMap';
import {
    fetchLogs, fetchReports, generateReport, ingestLog, bulkIngestLogs, fetchDetections, subscribeToLogs, ATTACK_PRESETS
} from './api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getSeverityColor = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
};

const getSeverityDot = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return 'bg-rose-500';
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return 'bg-orange-400';
    return 'bg-emerald-500';
};

const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString([], { hour12: false }); }
    catch { return '--:--:--'; }
};

// ─── Mini Bar Chart (no external lib needed) ──────────────────────────────────

const ThreatBarChart = ({ logs }) => {
    const counts = { NORMAL: 0, SUSPICIOUS: 0, THREAT: 0 };
    logs.forEach(l => {
        const lbl = (l.label || 'NORMAL').toUpperCase();
        if (lbl === 'THREAT' || lbl === 'CRITICAL') counts.THREAT++;
        else if (lbl === 'SUSPICIOUS' || lbl === 'HIGH' || lbl === 'MEDIUM') counts.SUSPICIOUS++;
        else counts.NORMAL++;
    });
    const total = logs.length || 1;
    const bars = [
        { label: 'Normal', count: counts.NORMAL, color: 'bg-emerald-500', pct: (counts.NORMAL / total) * 100 },
        { label: 'Suspicious', count: counts.SUSPICIOUS, color: 'bg-orange-400', pct: (counts.SUSPICIOUS / total) * 100 },
        { label: 'Threat', count: counts.THREAT, color: 'bg-rose-500', pct: (counts.THREAT / total) * 100 },
    ];

    return (
        <div className="space-y-5">
            {bars.map((b) => (
                <div key={b.label}>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-white/50 font-bold uppercase tracking-widest">{b.label}</span>
                        <span className="text-white/70 font-mono">{b.count} <span className="text-white/30">({b.pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${b.pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full ${b.color} rounded-full`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Simulate Attack Panel ────────────────────────────────────────────────────

const SimulatePanel = ({ onResult }) => {
    const [selected, setSelected] = useState('brute_force');
    const [status, setStatus] = useState('idle'); // idle | running | done | error
    const [result, setResult] = useState(null);
    const [progress, setProgress] = useState(0);

    const run = async () => {
        setStatus('running');
        setResult(null);
        setProgress(30);

        const preset = ATTACK_PRESETS[selected];

        try {
            const res = await bulkIngestLogs(preset.logs);
            setProgress(100);
            setResult(res.last_analysis);
            setStatus('done');
            if (onResult) onResult(res.last_analysis);
        } catch (e) {
            setStatus('error');
            setResult({ error: e.message });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-extrabold font-grotesk text-white tracking-tighter mb-2">Attack Simulator</h3>
                <p className="text-sm text-white/30">Inject synthetic attack logs into the ML engine and watch it classify threats in real-time.</p>
            </div>

            {/* Attack Type Selector */}
            <div className="grid grid-cols-3 gap-4">
                {Object.entries(ATTACK_PRESETS).map(([key, preset]) => (
                    <button
                        key={key}
                        onClick={() => { setSelected(key); setStatus('idle'); setResult(null); }}
                        className={`p-6 rounded-3xl text-left border transition-all ${selected === key
                            ? 'bg-white border-white text-black'
                            : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <Zap className={`w-5 h-5 ${selected === key ? 'text-black' : 'text-orange-400'}`} />
                            <span className="font-black text-sm uppercase tracking-tight">{preset.label}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${selected === key ? 'text-black/60' : 'text-white/30'}`}>
                            {preset.description}
                        </p>
                        <p className={`text-[10px] font-mono mt-3 ${selected === key ? 'text-black/40' : 'text-white/20'}`}>
                            {preset.logs.length} log{preset.logs.length > 1 ? 's' : ''} injected
                        </p>
                    </button>
                ))}
            </div>

            {/* Run Button */}
            <button
                onClick={run}
                disabled={status === 'running'}
                className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {status === 'running' ? (
                    <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        Injecting... {progress}%
                    </>
                ) : (
                    <>
                        <Zap className="w-4 h-4" />
                        Launch {ATTACK_PRESETS[selected].label} Attack
                    </>
                )}
            </button>

            {/* Progress Bar */}
            {status === 'running' && (
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-orange-400 rounded-full"
                        transition={{ duration: 0.2 }}
                    />
                </div>
            )}

            {/* Result */}
            <AnimatePresence>
                {result && status === 'done' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-3xl border border-white/10 bg-white/5 space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span className="font-black text-white uppercase tracking-widest text-sm">ML Engine Response</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Classification</p>
                                <p className={`text-xl font-black ${getSeverityColor(result.label).split(' ')[0]}`}>{result.label}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Confidence</p>
                                <p className="text-xl font-black text-white">{((result.confidence || 0) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Severity Index</p>
                                <p className="text-xl font-black text-white">{result.severity_index ?? '—'} / 2</p>
                            </div>
                        </div>
                        {result.features && (
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Feature Vector</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(result.features).map(([k, v]) => (
                                        <div key={k} className="flex justify-between text-xs">
                                            <span className="text-white/40 font-mono">{k}</span>
                                            <span className="text-white/70 font-bold">{typeof v === 'number' ? v.toFixed(2) : v}</span>
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
                        className="p-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 flex items-center gap-4"
                    >
                        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-rose-400">API Error</p>
                            <p className="text-xs text-rose-400/60 mt-1">{result.error}</p>
                            <p className="text-xs text-white/30 mt-2">Make sure the FastAPI backend is running: <code className="font-mono">uvicorn app.main:app --reload</code></p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Reports Tab ─────────────────────────────────────────────────────────────

const ReportsTab = ({ incidents, isLoading, onGenerate }) => {
    const [selectedReport, setSelectedReport] = useState(null);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try { await onGenerate(); }
        finally { setGenerating(false); }
    };

    return (
        <div className="grid grid-cols-12 gap-12 h-full">
            <div className="col-span-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-extrabold font-grotesk text-white tracking-tighter">Incident Stream</h3>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-tight hover:opacity-90 transition-all disabled:opacity-40"
                    >
                        {generating ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                        {generating ? 'Generating...' : 'New Report'}
                    </button>
                </div>
                <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 hide-scrollbar">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)
                    ) : incidents.length === 0 ? (
                        <div className="text-center py-12 text-white/20">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="text-sm font-bold">No reports yet</p>
                            <p className="text-xs mt-1">Run Simulate Attack then click New Report</p>
                        </div>
                    ) : incidents.map((inc, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedReport(inc)}
                            className={`w-full group p-6 rounded-3xl text-left transition-all border ${selectedReport?.report_id === inc.report_id
                                ? 'bg-white border-white'
                                : 'bg-white/5 border-white/10 hover:border-white/30'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${selectedReport?.report_id === inc.report_id
                                    ? 'bg-black/10 border-black/20 text-black'
                                    : getSeverityColor(inc.severity_label)
                                    }`}>
                                    {inc.severity_label || 'UNKNOWN'}
                                </span>
                                <span className={`text-[10px] font-mono ${selectedReport?.report_id === inc.report_id ? 'text-black/40' : 'text-white/20'}`}>
                                    {inc.report_id?.slice(0, 8)}
                                </span>
                            </div>
                            <h4 className={`text-base font-bold tracking-tight mb-1 ${selectedReport?.report_id === inc.report_id ? 'text-black' : 'text-white'}`}>
                                {inc.source_ip || inc.log_data?.ip_address || 'Unknown IP'}
                            </h4>
                            <p className={`text-xs ${selectedReport?.report_id === inc.report_id ? 'text-black/60' : 'text-white/30'}`}>
                                {inc.event_type || inc.log_data?.event_type || 'Unknown event'}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="col-span-8">
                {selectedReport ? (
                    <GlassCard className="h-full !p-0 flex flex-col border-white/10 overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                    <FileText className="w-7 h-7 text-black" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-grotesk text-white">Forensic Investigation</h3>
                                    <p className="text-xs text-white/30 font-mono mt-1">{selectedReport.report_id}</p>
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${getSeverityColor(selectedReport.severity_label)}`}>
                                {selectedReport.severity_label}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 bg-black/[0.05] selection:bg-white selection:text-black hide-scrollbar">
                            <div className="prose prose-invert max-w-none
                                prose-h1:font-grotesk prose-h1:text-3xl prose-h1:text-white prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-6
                                prose-h2:font-grotesk prose-h2:text-xl prose-h2:text-white/80 prose-h2:mt-10
                                prose-p:text-white/60 prose-p:leading-relaxed
                                prose-li:text-white/60 prose-strong:text-white prose-code:text-orange-300">
                                <ReactMarkdown>{selectedReport.report_markdown || selectedReport.markdown || '*No content available*'}</ReactMarkdown>
                            </div>
                        </div>
                    </GlassCard>
                ) : (
                    <div className="h-full glass-card border-dashed border-white/10 flex flex-col items-center justify-center space-y-8 min-h-[500px] rounded-3xl border">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full animate-pulse" />
                            <FileText className="w-20 h-20 text-white/10 relative z-10" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-bold text-white/20 font-grotesk tracking-tighter">SELECT ARTIFACT</h4>
                            <p className="text-sm text-white/10 tracking-[0.2em] font-black uppercase mt-2">Awaiting Forensic Access</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = ({ onExit }) => {
    const [logs, setLogs] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [apiMetadata, setApiMetadata] = useState({ es_connected: false, mode: 'Initializing...' });

    const loadData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const [logsRes, reportsData] = await Promise.allSettled([
                fetchLogs(20),
                fetchReports(),
            ]);

            if (logsRes.status === 'fulfilled') {
                setLogs(logsRes.value.logs || []);
                if (logsRes.value.metadata) setApiMetadata(logsRes.value.metadata);
                setApiError(null);
            } else {
                setApiError('Cannot reach API — is the FastAPI server running on port 8000?');
            }

            if (reportsData.status === 'fulfilled') {
                setIncidents(Array.isArray(reportsData.value) ? reportsData.value : []);
            }
        } finally {
            setIsLoading(false);
            if (showRefresh) setTimeout(() => setIsRefreshing(false), 800);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Subscribe to real-time updates via WebSockets
        const ws = subscribeToLogs((msg) => {
            if (msg.type === 'NEW_LOG') {
                setLogs(prev => [msg.log, ...prev].slice(0, 1000));
            } else if (msg.type === 'BULK_LOGS') {
                loadData(true); // Pull everything if bulk happened
            }
        });

        return () => ws.close();
    }, [loadData]);

    // Compute stats from real logs
    const threatCount = logs.filter(l => ['THREAT', 'CRITICAL'].includes(l.label?.toUpperCase())).length;
    const suspiciousCount = logs.filter(l => ['SUSPICIOUS', 'HIGH', 'MEDIUM'].includes(l.label?.toUpperCase())).length;
    const avgConfidence = logs.length
        ? (logs.reduce((s, l) => s + (l.confidence || 0.9), 0) / logs.length * 100).toFixed(1)
        : '—';

    const stats = [
        { label: 'Events Loaded', value: logs.length || '—', trend: 'LIVE', color: 'white' },
        { label: 'Active Threats', value: threatCount, trend: threatCount > 0 ? 'CRITICAL' : 'CLEAR', color: threatCount > 0 ? 'rose-500' : 'emerald-400' },
        { label: 'Model Confidence', value: `${avgConfidence}%`, trend: 'OPTIMIZED', color: 'emerald-400' },
        { label: 'Incidents Filed', value: incidents.length, trend: 'ARCHIVED', color: 'blue-400' },
    ];

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Central Hub' },
        { id: 'traffic', icon: Activity, label: 'Neural Feed' },
        { id: 'reports', icon: FileText, label: 'AI Forensics' },
        { id: 'simulate', icon: Zap, label: 'Attack Sim' },
    ];

    const handleGenerateReport = async () => {
        // Use the most recent threat log for the report
        const threatLog = logs.find(l => ['THREAT', 'CRITICAL', 'SUSPICIOUS'].includes(l.label?.toUpperCase())) || logs[0];
        if (!threatLog) return;
        const mlResult = {
            label: threatLog.label || 'Normal',
            severity_index: threatLog.label?.toUpperCase() === 'THREAT' ? 2 : threatLog.label?.toUpperCase() === 'SUSPICIOUS' ? 1 : 0,
            confidence: threatLog.confidence || 0.9,
            features: threatLog.features || {},
        };
        await generateReport(threatLog, mlResult);
        await loadData();
    };

    return (
        <div className="flex h-screen bg-[#020203] text-foreground overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 glass border-r border-white/5 flex flex-col z-20">
                <button
                    onClick={onExit}
                    className="p-8 flex items-center gap-4 group/logo hover:opacity-80 transition-all cursor-pointer"
                >
                    <div className="p-2 rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover/logo:scale-110 transition-transform duration-500">
                        <Shield className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-xl font-bold font-grotesk tracking-tighter text-white uppercase italic">THE NOIR</span>
                </button>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full group flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${activeTab === item.id
                                ? 'bg-white/5 text-white border border-white/10'
                                : 'text-muted-foreground hover:text-white hover:bg-white/[0.02]'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-muted-foreground'}`} />
                                <span className="font-medium tracking-tight">{item.label}</span>
                            </div>
                            {activeTab === item.id && (
                                <motion.div layoutId="active-pill" className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-6 space-y-4">
                    {/* API Status */}
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Engine Status</p>
                            {!apiMetadata.es_connected && (
                                <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-black uppercase">No DB</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Cpu className="w-5 h-5 text-white/80" />
                                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ${apiError ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            </div>
                            <span className="text-sm font-bold text-white/90">{apiError ? 'API OFFLINE' : apiMetadata.mode}</span>
                        </div>
                        {apiError && <p className="text-[10px] text-rose-400/60 mt-2 leading-relaxed">{apiError}</p>}
                        {!apiError && (
                            <div className="mt-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                <p className="text-[9px] text-white/20 font-mono uppercase tracking-tighter">Persistence: Enabled</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onExit}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-rose-500/20 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        <X className="w-4 h-4" />
                        Terminate Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="h-24 px-12 flex items-center justify-between z-10 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-extrabold font-grotesk tracking-tighter text-white">
                            {activeTab === 'dashboard' && 'Infiltration Overview'}
                            {activeTab === 'traffic' && 'Neural Feed'}
                            {activeTab === 'reports' && 'AI Forensics'}
                            {activeTab === 'simulate' && 'Attack Simulator'}
                        </h2>
                        {isRefreshing && <RefreshCcw className="w-4 h-4 text-white/40 animate-spin" />}
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type="text" placeholder="Search neural stream..."
                                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all w-72 text-white placeholder:text-white/20"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <MagneticButton className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative">
                                <Bell className="w-5 h-5 text-white/60" />
                                {threatCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-black flex items-center justify-center">
                                        {threatCount}
                                    </span>
                                )}
                            </MagneticButton>
                            <div className="h-12 w-[1px] bg-white/5" />
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-white tracking-tight">SOC ANALYST</p>
                                    <p className="text-[10px] text-emerald-400 font-mono">LEVEL 4 ADMIN</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center font-black text-sm">
                                    <Shield className="w-5 h-5 text-white/60" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-12 hide-scrollbar">
                    <AnimatePresence mode="wait">

                        {/* ── CENTRAL HUB ── */}
                        {activeTab === 'dashboard' && (
                            <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-6">
                                    {stats.map((stat, i) => (
                                        <GlassCard key={i} delay={i * 0.1} className="relative overflow-hidden group">
                                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black mb-4 flex justify-between items-center">
                                                {stat.label}
                                                <span className={`text-[9px] ${stat.color === 'rose-500' ? 'text-rose-500' : stat.color === 'blue-400' ? 'text-blue-400' : 'text-emerald-500'}`}>{stat.trend}</span>
                                            </p>
                                            <h3 className="text-4xl font-bold font-grotesk tracking-tighter text-white group-hover:scale-105 transition-transform duration-500">{stat.value}</h3>
                                            <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '70%' }}
                                                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }}
                                                    className="h-full bg-white/20"
                                                />
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>

                                {/* Threat Distribution + Recent Logs */}
                                <div className="grid grid-cols-3 gap-8">
                                    <GlassCard className="col-span-1 flex flex-col justify-between">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold font-grotesk text-white">Global Threat Map</h3>
                                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Live Incursion Stream</p>
                                        </div>
                                        <div className="flex-1 min-h-[160px]">
                                            {isLoading ? <Skeleton className="h-full w-full" /> : <ThreatMap logs={logs} />}
                                        </div>
                                        <div className="mt-6">
                                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Severity Ratio</h4>
                                            {isLoading ? <Skeleton className="h-10 w-full" /> : <ThreatBarChart logs={logs} />}
                                        </div>
                                    </GlassCard>

                                    <GlassCard className="col-span-2 !p-0 border-white/5">
                                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold font-grotesk text-white">Live Telemetry Loop</h3>
                                                <p className="text-xs text-white/30 mt-1">Last {logs.length} events from the ML engine</p>
                                            </div>
                                            <button onClick={() => loadData(true)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                                                <RefreshCcw className="w-3 h-3" /> Refresh
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-white/[0.02] text-white/40 text-[10px] uppercase font-black tracking-widest">
                                                        <th className="px-6 py-4">IP Address</th>
                                                        <th className="px-6 py-4">Event</th>
                                                        <th className="px-6 py-4 text-center">Label</th>
                                                        <th className="px-6 py-4 text-right">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {isLoading ? (
                                                        [...Array(5)].map((_, i) => (
                                                            <tr key={i}><td colSpan="4" className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
                                                        ))
                                                    ) : logs.slice(0, 8).map((log, i) => (
                                                        <motion.tr
                                                            key={i}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.04 }}
                                                            className="hover:bg-white/[0.02] transition-colors"
                                                        >
                                                            <td className="px-6 py-4 font-bold text-white text-sm">{log.ip_address}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                                                                    {log.event_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${getSeverityColor(log.label)}`}>
                                                                    {log.label || 'NORMAL'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-xs font-mono text-white/30">
                                                                {formatTime(log.timestamp)}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </GlassCard>
                                </div>
                            </motion.div>
                        )}

                        {/* ── NEURAL FEED (full log table) ── */}
                        {activeTab === 'traffic' && (
                            <motion.div key="traffic" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <GlassCard className="!p-0 border-white/5">
                                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold font-grotesk text-white">Full Neural Feed</h3>
                                            <p className="text-sm text-white/30 mt-1">{logs.length} events loaded — auto-refreshes every 5s</p>
                                        </div>
                                        <button onClick={() => loadData(true)} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black hover:opacity-90 transition-all flex items-center gap-2">
                                            <RefreshCcw className="w-3 h-3" /> Refresh
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-white/[0.02] text-white/40 text-[10px] uppercase font-black tracking-widest">
                                                    <th className="px-8 py-5">Node Identity</th>
                                                    <th className="px-8 py-5">User</th>
                                                    <th className="px-8 py-5">Event Pulse</th>
                                                    <th className="px-8 py-5">Port</th>
                                                    <th className="px-8 py-5 text-center">Security Tag</th>
                                                    <th className="px-8 py-5">Confidence</th>
                                                    <th className="px-8 py-5 text-right">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {isLoading ? (
                                                    [...Array(8)].map((_, i) => (
                                                        <tr key={i}><td colSpan="7" className="p-6"><Skeleton className="h-12 w-full" /></td></tr>
                                                    ))
                                                ) : logs.map((log, i) => (
                                                    <motion.tr
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        <td className="px-8 py-5 font-bold text-white tracking-tight">{log.ip_address}</td>
                                                        <td className="px-8 py-5 text-xs text-white/40 font-mono">{log.user_id || '—'}</td>
                                                        <td className="px-8 py-5">
                                                            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-white/60">
                                                                {log.event_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-xs font-mono text-white/40">{log.port_number || '—'}</td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getSeverityColor(log.label)}`}>
                                                                {log.label || 'NORMAL'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(log.confidence || 0.9) * 100}%` }}
                                                                        className="h-full bg-gradient-to-r from-white to-white/40"
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-mono text-white/40">{((log.confidence || 0.9) * 100).toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right text-xs font-mono text-white/30">
                                                            {formatTime(log.timestamp)}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* ── AI FORENSICS ── */}
                        {activeTab === 'reports' && (
                            <motion.div key="reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                                <ReportsTab incidents={incidents} isLoading={isLoading} onGenerate={handleGenerateReport} />
                            </motion.div>
                        )}

                        {/* ── ATTACK SIMULATOR ── */}
                        {activeTab === 'simulate' && (
                            <motion.div key="simulate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <GlassCard>
                                    <SimulatePanel onResult={() => loadData(true)} />
                                </GlassCard>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
