import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import PageHeader from '../components/PageHeader';
import IncidentPanel from '../components/IncidentPanel';
import IncidentDrillDown from '../components/IncidentDrillDown';
import AIThreatTimeline from '../components/AIThreatTimeline';
import Skeleton from '../components/Skeleton';
import {
    ShieldAlert, Activity, CheckCircle, ChevronRight, RefreshCcw,
    Network, ChevronDown, AlertTriangle
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getSeverityColor = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
};

const scoreColor = (score) => {
    if (score >= 90) return '#E11D48';
    if (score >= 70) return '#F97316';
    if (score >= 40) return '#EAB308';
    return '#10B981';
};

const scoreLabel = (score) => {
    if (score >= 90) return 'CRITICAL';
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
};

const formatTime = (ts) => {
    try {
        const d = new Date(ts);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`;
    } catch { return '--:--:--'; }
};

// Simplified alert details panel (for raw log alerts)
const AlertDetailsPanel = ({ alert, onClose }) => {
    if (!alert) return null;
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-full bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mb-3 inline-block ${getSeverityColor(alert.label)}`}>
                        {alert.label || 'Unknown'}
                    </span>
                    <h3 className="text-xl font-bold text-white">{alert.event_type}</h3>
                    <p className="text-[10px] text-white/30 font-mono mt-1">{formatTime(alert.timestamp)}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-3">
                    <div>
                        <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Source IP</p>
                        <p className="text-base font-bold text-white font-mono">{alert.ip_address || '—'}</p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Port</p>
                            <p className="text-sm font-mono text-white/70">{alert.port_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">User</p>
                            <p className="text-sm font-mono text-white/70">{alert.user_id || '—'}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                    <div className="flex justify-between mb-2">
                        <p className="text-[9px] text-emerald-400/60 uppercase tracking-widest">ML Confidence</p>
                        <span className="text-xs font-mono text-emerald-400">{((alert.confidence || 0.9) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(alert.confidence || 0.9) * 100}%` }}
                            className="h-full bg-emerald-500"
                        />
                    </div>
                </div>
                {alert.features && Object.keys(alert.features).length > 0 && (
                    <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                        <p className="text-[9px] text-white/25 uppercase tracking-widest mb-3">Feature Vectors</p>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(alert.features).map(([k, v]) => (
                                <div key={k}>
                                    <p className="text-[9px] text-white/30 font-mono truncate">{k}</p>
                                    <p className="text-sm font-bold text-white mt-0.5">{typeof v === 'number' ? v.toFixed(2) : String(v)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const IncidentsPage = ({ incidents: propIncidents = [], logs = [], isLoading, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('incidents');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [filterLevel, setFilterLevel] = useState('ALL');

    // Agent-correlated incidents state
    const [agentIncidents, setAgentIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [incLoading, setIncLoading] = useState(false);

    const fetchAgentIncidents = useCallback(async () => {
        setIncLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/agents/incidents?limit=50`);
            if (res.ok) {
                const data = await res.json();
                setAgentIncidents(data.incidents || []);
            }
        } catch { /* silent */ }
        finally { setIncLoading(false); }
    }, []);

    useEffect(() => {
        fetchAgentIncidents();
        const id = setInterval(fetchAgentIncidents, 8000);
        return () => clearInterval(id);
    }, [fetchAgentIncidents]);

    // Merge prop incidents + agent incidents, deduplicate by id
    const allIncidents = [...agentIncidents];

    const alerts = logs.filter(log => {
        const lbl = (log.label || '').toUpperCase();
        if (['NORMAL', 'SAFE'].includes(lbl)) return false;
        if (filterLevel === 'THREAT' && !['THREAT', 'CRITICAL'].includes(lbl)) return false;
        if (filterLevel === 'SUSPICIOUS' && !['SUSPICIOUS', 'HIGH'].includes(lbl)) return false;
        return true;
    });

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                icon={ShieldAlert}
                iconColor="#E11D48"
                title="Incidents & Alerts"
                subtitle="Real-time threat detection · Triage queue · Alert stream"
            />

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
                {[
                    { id: 'incidents', Icon: Network, label: 'Correlated Incidents', count: allIncidents.length },
                    { id: 'alerts', Icon: Activity, label: 'Raw Alerts', count: alerts.length },
                ].map(({ id, Icon, label, count }) => (
                    <button key={id}
                        onClick={() => { setActiveTab(id); setSelectedAlert(null); setSelectedIncident(null); }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                    >
                        <Icon className="w-3.5 h-3.5" /> {label}
                        {count > 0 && (
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === id ? 'bg-black/10 text-black/60' : 'bg-rose-500/20 text-rose-400'}`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── INCIDENTS TAB ── */}
            {activeTab === 'incidents' && (
                <div className="grid grid-cols-12 gap-6 pb-12">
                    {/* Incident list */}
                    <div className={`transition-all duration-300 ${selectedIncident ? 'col-span-12 xl:col-span-5' : 'col-span-12'}`}>
                        <SentinelGrid>
                            <SentinelSection
                                id="agent-incidents"
                                colSpan="col-span-12"
                                title={`Agent-Correlated Incidents · ${allIncidents.length}`}
                            >
                                <div className="space-y-2 max-h-[620px] overflow-y-auto hide-scrollbar pb-2">
                                    {incLoading && allIncidents.length === 0 ? (
                                        [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
                                    ) : allIncidents.length === 0 ? (
                                        <div className="py-16 text-center border border-dashed border-white/8 rounded-2xl">
                                            <Network className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                            <p className="text-[11px] font-mono text-white/20 uppercase tracking-widest">
                                                No correlated incidents yet
                                            </p>
                                            <p className="text-[10px] text-white/10 mt-2 font-mono">
                                                Run an attack simulation to generate incidents
                                            </p>
                                        </div>
                                    ) : allIncidents.map((inc, i) => {
                                        const score = inc.composite_score ?? inc.score ?? 50;
                                        const color = scoreColor(score);
                                        const sev = scoreLabel(score);
                                        const isActive = selectedIncident?.incident_id === inc.incident_id;
                                        return (
                                            <motion.button
                                                key={inc.incident_id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                onClick={() => setSelectedIncident(isActive ? null : inc)}
                                                className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center gap-4 ${isActive
                                                    ? 'border-white/20 bg-white/[0.06]'
                                                    : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'}`}
                                            >
                                                {/* Score circle */}
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                                                    style={{ background: `${color}15`, border: `1px solid ${color}35`, color }}>
                                                    {score}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="text-sm font-bold text-white truncate">{inc.attack_type}</h4>
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex-shrink-0"
                                                            style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                                                            {sev}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-white/30 font-mono truncate">
                                                        {inc.source_ip} · {inc.event_count} events · {inc.incident_id}
                                                    </p>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isActive ? 'rotate-90 text-white/60' : 'text-white/15'}`} />
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </SentinelSection>
                        </SentinelGrid>

                        {/* AI Timeline below list */}
                        {!selectedIncident && (
                            <div className="mt-6">
                                <SentinelGrid>
                                    <SentinelSection id="ai-forensics" colSpan="col-span-12" title="AI Forensic Timeline">
                                        <div className="h-[340px]">
                                            <AIThreatTimeline />
                                        </div>
                                    </SentinelSection>
                                </SentinelGrid>
                            </div>
                        )}
                    </div>

                    {/* Drill-down panel */}
                    <AnimatePresence>
                        {selectedIncident && (
                            <div className="col-span-12 xl:col-span-7 min-h-[640px]">
                                <IncidentDrillDown
                                    incident={selectedIncident}
                                    onClose={() => setSelectedIncident(null)}
                                />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── ALERTS TAB ── */}
            {activeTab === 'alerts' && (
                <>
                    <div className="flex items-center gap-2 mb-5">
                        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                            {['ALL', 'THREAT', 'SUSPICIOUS'].map(level => (
                                <button key={level} onClick={() => setFilterLevel(level)}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterLevel === level ? 'bg-white text-black' : 'text-white/30 hover:text-white/60'}`}>
                                    {level}
                                </button>
                            ))}
                        </div>
                        {onRefresh && (
                            <button onClick={onRefresh} className="p-2 rounded-xl hover:bg-white/10 text-white/40 transition-colors">
                                <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-12 gap-6 pb-12">
                        <div className={`transition-all duration-400 ${selectedAlert ? 'col-span-12 xl:col-span-7' : 'col-span-12'}`}>
                            <SentinelGrid>
                                <SentinelSection id="alert-queue" colSpan="col-span-12" title="Detection Queue">
                                    <div className="flex flex-col gap-2 max-h-[700px] overflow-y-auto hide-scrollbar pb-4">
                                        {isLoading ? (
                                            [...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                                        ) : alerts.length === 0 ? (
                                            <div className="py-20 text-center border border-dashed border-white/8 rounded-2xl">
                                                <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-emerald-400/20" />
                                                <p className="text-[11px] font-mono text-emerald-400/40 uppercase tracking-widest">Zero Active Alerts</p>
                                            </div>
                                        ) : alerts.map((alert, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                onClick={() => setSelectedAlert(alert)}
                                                className={`w-full group px-5 py-3.5 rounded-xl text-left border flex items-center gap-4 transition-all ${selectedAlert?.timestamp === alert.timestamp
                                                    ? 'bg-white/[0.07] border-white/20'
                                                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.05]'}`}
                                            >
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getSeverityColor(alert.label).split(' ')[0].replace('text-', 'bg-')}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="text-sm font-bold text-white">{alert.ip_address}</h4>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getSeverityColor(alert.label)}`}>
                                                            {alert.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-white/35 font-mono">{alert.event_type} · Port {alert.port_number || '—'}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-bold text-white/70">{((alert.confidence || 0.9) * 100).toFixed(0)}%</p>
                                                    <p className="text-[9px] text-white/25 font-mono">{formatTime(alert.timestamp)}</p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </SentinelSection>
                            </SentinelGrid>
                        </div>

                        <AnimatePresence>
                            {selectedAlert && (
                                <div className="col-span-12 xl:col-span-5 min-h-[600px]">
                                    <AlertDetailsPanel alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
};

export default IncidentsPage;
