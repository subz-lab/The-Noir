import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, AlertTriangle, Activity, LayoutDashboard, FileText,
    Settings, Search, Bell, RefreshCcw, ExternalLink, ChevronRight,
    Database, Cpu, Menu, X, PlusCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import GlassCard from './components/GlassCard';
import MagneticButton from './components/MagneticButton';
import Skeleton from './components/Skeleton';

const Dashboard = ({ onExit }) => {
    const [logs, setLogs] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    // ... existing fetch and effect logic ...
    // (Note: I will use the actual existing code in the target replacement below)


    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs?limit=15');
            const data = await response.json();
            if (data.status === 'success') setLogs(data.logs);
        } catch (error) { console.error(error); }
    };

    const fetchIncidents = async () => {
        try {
            const response = await fetch('/api/reports/');
            const data = await response.json();
            setIncidents(data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchLogs(), fetchIncidents()]);
            setIsLoading(false);
        };
        init();

        const interval = setInterval(() => {
            setIsRefreshing(true);
            fetchLogs();
            fetchIncidents();
            setTimeout(() => setIsRefreshing(false), 1000);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (label) => {
        switch (label?.toUpperCase()) {
            case 'THREAT':
            case 'CRITICAL': return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
            case 'SUSPICIOUS':
            case 'HIGH': return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
            default: return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
        }
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
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Central Hub' },
                        { id: 'incidents', icon: AlertTriangle, label: 'Threat Ledger' },
                        { id: 'traffic', icon: Activity, label: 'Neural Feed' },
                        { id: 'reports', icon: FileText, label: 'AI Forensics' },
                    ].map((item) => (
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
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mb-2">Engine Status</p>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Cpu className="w-5 h-5 text-white/80" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            <span className="text-sm font-bold text-white/90">RF-NEURAL v1.4</span>
                        </div>
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

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="h-24 px-12 flex items-center justify-between z-10 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-extrabold font-grotesk tracking-tighter text-white">
                            {activeTab === 'dashboard' ? 'Infiltration Overview' : 'Threat Intelligence'}
                        </h2>
                        {isRefreshing && <RefreshCcw className="w-4 h-4 text-white/40 animate-spin" />}
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type="text" placeholder="Search neural stream..."
                                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all w-80 text-white placeholder:text-white/20"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <MagneticButton className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <Bell className="w-5 h-5 text-white/60" />
                            </MagneticButton>
                            <div className="h-12 w-[1px] bg-white/5" />
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-white tracking-tight">V. PEDNEKAR</p>
                                    <p className="text-[10px] text-emerald-400 font-mono">LEVEL 4 ADMIN</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center font-black text-sm">VP</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Scroll View */}
                <div className="flex-1 overflow-y-auto p-12 hide-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dashboard' ? (
                            <motion.div
                                key="dash"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-12"
                            >
                                {/* Stats Cards */}
                                <div className="grid grid-cols-4 gap-8">
                                    {[
                                        { label: 'Event Ingress', value: '24,787', trend: '+12%', color: 'white' },
                                        { label: 'Neural Blocks', value: '42', trend: 'CRITICAL', color: 'rose-500' },
                                        { label: 'Model Confidence', value: '90.1%', trend: 'OPTIMIZED', color: 'emerald-400' },
                                        { label: 'Latency Pulse', value: '5.2ms', trend: 'STABLE', color: 'blue-400' },
                                    ].map((stat, i) => (
                                        <GlassCard key={i} delay={i * 0.1} className="relative overflow-hidden group">
                                            <p className="text-[10px] items-center text-white/30 uppercase tracking-[0.2em] font-black mb-4 flex justify-between">
                                                {stat.label}
                                                <span className={`text-[9px] ${stat.color === 'rose-500' ? 'text-rose-500' : 'text-emerald-500'}`}>{stat.trend}</span>
                                            </p>
                                            <h3 className={`text-4xl font-bold font-grotesk tracking-tighter text-white group-hover:scale-105 transition-transform duration-500`}>{stat.value}</h3>
                                            <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '70.7%' }}
                                                    transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                                                    className="h-full bg-white/20"
                                                />
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>

                                {/* Main Table Area */}
                                <GlassCard className="!p-0 border-white/5">
                                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold font-grotesk text-white">Live Telemetry Loop</h3>
                                            <p className="text-sm text-white/30 tracking-tight mt-1">Real-time behavior analysis across all monitored nodes.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">Filter</button>
                                            <button className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:glow-white transition-all">Export</button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-white/[0.02] text-white/40 text-[10px] uppercase font-black tracking-widest">
                                                    <th className="px-8 py-5">Node Identity</th>
                                                    <th className="px-8 py-5">Event Pulse</th>
                                                    <th className="px-8 py-5 text-center">Security Tag</th>
                                                    <th className="px-8 py-5">Confidence</th>
                                                    <th className="px-8 py-5 text-right">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {isLoading ? (
                                                    [...Array(6)].map((_, i) => (
                                                        <tr key={i}><td colSpan="5" className="p-6"><Skeleton className="h-12 w-full" /></td></tr>
                                                    ))
                                                ) : logs.map((log, i) => (
                                                    <motion.tr
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        key={i}
                                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                                    >
                                                        <td className="px-8 py-6 font-bold text-white tracking-tight">{log.ip_address}</td>
                                                        <td className="px-8 py-6">
                                                            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-white/60">
                                                                {log.event_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getSeverityColor(log.label)}`}>
                                                                {log.label || 'NORMAL'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(log.confidence || 0.9) * 100}%` }}
                                                                        className="h-full bg-gradient-to-r from-white to-white/40 shadow-[0_0_10px_white]"
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-mono text-white/40">{(log.confidence || 0.99).toFixed(2)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right text-xs font-mono text-white/30 uppercase">
                                                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ) : (
                            /* Incidents Tab Refinement */
                            <motion.div
                                key="incidents"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-12 gap-12"
                            >
                                <div className="col-span-4 space-y-6">
                                    <h3 className="text-2xl font-extrabold font-grotesk text-white tracking-tighter">Incident Stream</h3>
                                    <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-4 hide-scrollbar">
                                        {incidents.map((inc, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedReport(inc)}
                                                className={`w-full group p-6 rounded-3xl text-left transition-all border ${selectedReport?.report_id === inc.report_id
                                                    ? 'bg-white border-white'
                                                    : 'bg-white/5 border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${selectedReport?.report_id === inc.report_id
                                                        ? 'bg-black/10 border-black/20 text-black'
                                                        : getSeverityColor(inc.severity_label)
                                                        }`}>
                                                        {inc.severity_label}
                                                    </span>
                                                    <span className={`text-[10px] font-mono ${selectedReport?.report_id === inc.report_id ? 'text-black/40' : 'text-white/20'}`}>
                                                        {inc.report_id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <h4 className={`text-lg font-bold tracking-tight mb-1 ${selectedReport?.report_id === inc.report_id ? 'text-black' : 'text-white'}`}>
                                                    {inc.source_ip}
                                                </h4>
                                                <p className={`text-xs ${selectedReport?.report_id === inc.report_id ? 'text-black/60' : 'text-white/30'}`}>
                                                    Vector: {inc.event_type}
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
                                                <MagneticButton className="bg-white text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-tighter hover:glow-white transition-all">
                                                    Download Decrypt
                                                </MagneticButton>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-12 bg-black/[0.05] selection:bg-white selection:text-black">
                                                <div className="prose prose-invert max-w-none 
                                                    prose-h1:font-grotesk prose-h1:text-4xl prose-h1:text-white prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-6
                                                    prose-h2:font-grotesk prose-h2:text-2xl prose-h2:text-white/80 prose-h2:mt-12
                                                    prose-p:text-white/60 prose-p:leading-relaxed prose-p:text-lg
                                                    prose-li:text-white/60 prose-strong:text-white">
                                                    <ReactMarkdown>
                                                        {selectedReport.report_markdown}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    ) : (
                                        <div className="h-full glass-card border-dashed border-white/10 flex flex-col items-center justify-center space-y-8 min-h-[600px]">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full animate-pulse" />
                                                <FileText className="w-24 h-24 text-white/10 relative z-10" />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="text-2xl font-bold text-white/20 font-grotesk tracking-tighter">SELECT ARTIFACT</h4>
                                                <p className="text-sm text-white/10 tracking-[0.2em] font-black uppercase mt-2">Awaiting Forensic Access</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
