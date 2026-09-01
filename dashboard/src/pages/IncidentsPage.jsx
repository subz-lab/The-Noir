import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import IncidentPanel from '../components/IncidentPanel';
import AIThreatTimeline from '../components/AIThreatTimeline';
import Skeleton from '../components/Skeleton';
import { ShieldAlert, Activity, CheckCircle, ChevronRight, RefreshCcw } from 'lucide-react';

const getSeverityColor = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
};

const formatTime = (ts) => {
    try {
        const d = new Date(ts);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`;
    } catch { return '--:--:--'; }
};

const AlertDetailsPanel = ({ alert, onClose }) => {
    if (!alert) return null;
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-full bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col"
        >
            <div className="flex justify-between items-start mb-8">
                <div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-4 inline-block ${getSeverityColor(alert.label)}`}>
                        {alert.label || 'Unknown'} Alert
                    </span>
                    <h3 className="text-2xl font-bold font-grotesk text-white leading-none">{alert.event_type || 'Unknown Vector'}</h3>
                    <p className="text-sm text-white/40 mt-2 font-mono">{formatTime(alert.timestamp)}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronRight className="w-5 h-5 text-white/60" />
                </button>
            </div>
            <div className="space-y-6 flex-1 overflow-y-auto hide-scrollbar pr-2">
                <div className="p-6 rounded-2xl bg-[#020204]/40 border border-white/5 space-y-4">
                    <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Source Node / IP Access</p>
                        <p className="text-lg font-bold text-white tracking-tight">{alert.ip_address || '—'}</p>
                    </div>
                    <div className="flex gap-12">
                        <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Target Port</p>
                            <p className="text-base font-mono text-white/80">{alert.port_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">User Authorization</p>
                            <p className="text-base font-mono text-white/80">{alert.user_id || 'System / Unauth'}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-[#020204]/40 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Confidence Score</p>
                        <span className="text-xs font-mono text-emerald-400">{((alert.confidence || 0.9) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(alert.confidence || 0.9) * 100}%` }}
                            className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                        />
                    </div>
                </div>
                {alert.features && (
                    <div className="p-6 rounded-2xl bg-[#020204]/40 border border-white/5 space-y-4">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Detected Feature Vectors</p>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(alert.features).map(([k, v]) => (
                                <div key={k}>
                                    <p className="text-[10px] text-white/40 font-mono truncate">{k}</p>
                                    <p className="text-sm font-bold text-white mt-1">{typeof v === 'number' ? v.toFixed(2) : String(v)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex gap-4">
                <button className="flex-1 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl hover:opacity-90 transition-all flex justify-center items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Trigger Playbook
                </button>
                <button className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-emerald-500/20 transition-all flex justify-center items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Mitigated
                </button>
            </div>
        </motion.div>
    );
};

const IncidentsPage = ({ incidents, logs = [], isLoading, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('incidents'); // incidents | alerts
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [filterLevel, setFilterLevel] = useState('ALL');

    // Filter logs for alerts view
    const alerts = logs.filter(log => {
        const lbl = (log.label || '').toUpperCase();
        if (['NORMAL', 'SAFE'].includes(lbl)) return false;
        if (filterLevel === 'THREAT' && !['THREAT', 'CRITICAL'].includes(lbl)) return false;
        if (filterLevel === 'SUSPICIOUS' && !['SUSPICIOUS', 'HIGH'].includes(lbl)) return false;
        return true;
    });

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white font-grotesk tracking-tight">Incidents & Alerts</h2>
                        <p className="text-sm text-white/40">Real-time threat detection, triage queue, and alert stream</p>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
                <button
                    onClick={() => { setActiveTab('incidents'); setSelectedAlert(null); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'incidents' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                >
                    <ShieldAlert className="w-3.5 h-3.5" /> Incidents
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                >
                    <Activity className="w-3.5 h-3.5" /> Alerts
                    {alerts.length > 0 && (
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'alerts' ? 'bg-black/10 text-black/60' : 'bg-rose-500/20 text-rose-400'}`}>
                            {alerts.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'incidents' && (
                <>
                    <SentinelGrid className="mb-8">
                        <SentinelSection id="incident-queue-full" colSpan="col-span-12" title="Global Incident Queue">
                            <div className="h-[500px]">
                                <IncidentPanel incidents={incidents} />
                            </div>
                        </SentinelSection>
                    </SentinelGrid>

                    <SentinelGrid>
                        <SentinelSection id="ai-forensics-full" colSpan="col-span-12" title="AI Forensic Timeline (Automated Sequence)">
                            <div className="h-[400px]">
                                <AIThreatTimeline />
                            </div>
                        </SentinelSection>
                    </SentinelGrid>
                </>
            )}

            {activeTab === 'alerts' && (
                <>
                    {/* Alert Filters */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                            {['ALL', 'THREAT', 'SUSPICIOUS'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setFilterLevel(level)}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterLevel === level ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        {onRefresh && (
                            <button onClick={onRefresh} className="p-2 ml-2 rounded-xl hover:bg-white/10 text-white/60 transition-colors">
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-12 gap-8 pb-12">
                        <div className={`transition-all duration-500 ${selectedAlert ? 'col-span-12 xl:col-span-7' : 'col-span-12'}`}>
                            <SentinelGrid>
                                <SentinelSection id="alert-queue" colSpan="col-span-12" title="Detection Queue">
                                    <div className="flex flex-col gap-4 max-h-[800px] overflow-y-auto pr-2 hide-scrollbar pb-6 p-2">
                                        {isLoading ? (
                                            [...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                                        ) : alerts.length === 0 ? (
                                            <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl mt-4 bg-white/[0.02]">
                                                <ShieldAlert className="w-16 h-16 mx-auto mb-6 opacity-20 text-emerald-400" />
                                                <p className="text-lg font-bold tracking-widest uppercase text-emerald-400">Zero Active Alerts</p>
                                                <p className="text-xs mt-2 text-white/40 font-mono">Neural networks report nominal operations</p>
                                            </div>
                                        ) : alerts.map((alert, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => setSelectedAlert(alert)}
                                                className={`w-full group px-6 py-5 rounded-3xl text-left border flex items-center gap-6 transition-all ${selectedAlert?.timestamp === alert.timestamp
                                                    ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                                                    : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_10px_currentColor] ${getSeverityColor(alert.label).split(' ')[0].replace('text-', 'bg-')}`} />
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <h4 className="text-base font-bold text-white truncate">{alert.ip_address}</h4>
                                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getSeverityColor(alert.label)}`}>
                                                            {alert.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-white/50 font-mono truncate">{alert.event_type} • Port {alert.port_number || 'N/A'}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 flex flex-col justify-center">
                                                    <p className="text-sm font-bold text-white/80">{((alert.confidence || 0.9) * 100).toFixed(0)}% <span className="text-[10px] text-white/30 uppercase tracking-widest ml-1">Conf</span></p>
                                                    <p className="text-[10px] text-white/40 font-mono mt-1">{formatTime(alert.timestamp)}</p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </SentinelSection>
                            </SentinelGrid>
                        </div>

                        <div className={`transition-all duration-500 flex flex-col ${selectedAlert ? 'col-span-12 xl:col-span-5 h-[800px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                            <AnimatePresence>
                                {selectedAlert && (
                                    <AlertDetailsPanel
                                        alert={selectedAlert}
                                        onClose={() => setSelectedAlert(null)}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default IncidentsPage;
