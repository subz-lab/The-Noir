import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Clock, Cpu, AlertTriangle, CheckCircle2, XCircle,
    ChevronRight, X, Zap, Lock, FileText, ExternalLink
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

const fmtTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString([], { hour12: false }); } catch { return '—'; }
};

const fmtDateTime = (ts) => {
    try {
        const d = new Date(ts);
        return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString([], { hour12: false })}`;
    } catch { return '—'; }
};

const PHASE_COLORS = {
    recon: '#6366F1',
    brute_force: '#F97316',
    exploit: '#E11D48',
    exfil: '#A855F7',
    persistence: '#EC4899',
    unknown: '#6B7280',
};

const PHASE_LABELS = {
    recon: 'Reconnaissance',
    brute_force: 'Brute Force',
    exploit: 'Exploitation',
    exfil: 'Exfiltration',
    persistence: 'Persistence',
    unknown: 'Unknown',
};

const PHASE_MAP = {
    port_access: 'recon', port_scan: 'recon',
    login_failed: 'brute_force', login_attempt: 'brute_force',
    sql_injection: 'exploit', api_request: 'exploit', web_request: 'exploit',
    data_access: 'exfil', file_download: 'exfil',
    login_success: 'persistence', privilege_escalation: 'persistence',
};

const SOAR_ACTIONS = {
    brute_force: [
        { icon: '🚫', text: 'Block source IP at firewall' },
        { icon: '🔒', text: 'Lock compromised account immediately' },
        { icon: '🔄', text: 'Revoke all active sessions' },
        { icon: '🔑', text: 'Force credential rotation' },
        { icon: '🔍', text: 'Audit login history for affected user' },
    ],
    port_scan: [
        { icon: '🚫', text: 'Block scanning IP at perimeter' },
        { icon: '📡', text: 'Enable port-based rate limiting' },
        { icon: '🔍', text: 'Review exposed service inventory' },
        { icon: '📢', text: 'Alert network security team' },
    ],
    sql_injection: [
        { icon: '🚫', text: 'Block source IP immediately' },
        { icon: '🛡️', text: 'Enable WAF rule for SQL payloads' },
        { icon: '🗄️', text: 'Audit affected database tables' },
        { icon: '🔍', text: 'Check for data exfiltration' },
        { icon: '🩹', text: 'Patch vulnerable endpoint' },
    ],
    credential_stuffing: [
        { icon: '🔒', text: 'Lock affected accounts' },
        { icon: '🚫', text: 'Block source IP range' },
        { icon: '📱', text: 'Enforce MFA on all accounts' },
        { icon: '🔑', text: 'Force password reset' },
    ],
    default: [
        { icon: '🔍', text: 'Investigate source IP reputation' },
        { icon: '📢', text: 'Alert SOC team for manual review' },
        { icon: '📋', text: 'Preserve logs for forensic analysis' },
        { icon: '🔒', text: 'Apply least-privilege access controls' },
    ],
};

const getSOARActions = (attackType = '') => {
    const t = attackType.toLowerCase();
    if (t.includes('brute')) return SOAR_ACTIONS.brute_force;
    if (t.includes('port')) return SOAR_ACTIONS.port_scan;
    if (t.includes('sql')) return SOAR_ACTIONS.sql_injection;
    if (t.includes('credential')) return SOAR_ACTIONS.credential_stuffing;
    return SOAR_ACTIONS.default;
};

/**
 * IncidentDrillDown — SIH GAP A
 *
 * Full incident detail panel shown when an agent-correlated incident is selected.
 * Shows: risk score, attack timeline, event evidence, AI narrative, SOAR actions.
 */
const IncidentDrillDown = ({ incident, onClose }) => {
    if (!incident) return null;

    const score = incident.composite_score ?? incident.score ?? 50;
    const color = scoreColor(score);
    const sevLabel = scoreLabel(score);
    const actions = getSOARActions(incident.attack_type);

    const events = incident.events || [];
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    return (
        <motion.div
            key={incident.incident_id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full flex flex-col overflow-hidden rounded-2xl border"
            style={{ background: 'rgba(8,8,10,0.95)', borderColor: `${color}30`, backdropFilter: 'blur(40px)' }}
        >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-5 border-b flex items-start justify-between" style={{ borderColor: `${color}20` }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                        <ShieldAlert className="w-6 h-6" style={{ color }} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] font-mono" style={{ color }}>
                                {sevLabel}
                            </span>
                            <span className="text-[9px] text-white/20 font-mono">· {incident.incident_id}</span>
                        </div>
                        <h3 className="text-base font-black text-white tracking-tight leading-none">
                            {incident.attack_type}
                        </h3>
                        <p className="text-[10px] text-white/30 font-mono mt-1">
                            {fmtDateTime(incident.first_seen)} → {fmtTime(incident.last_seen)}
                        </p>
                    </div>
                </div>
                <button onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/10 text-white/30 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-5 space-y-4">

                {/* Risk Score */}
                <div className="p-4 rounded-xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Risk Score</span>
                        <span className="text-xl font-black font-mono" style={{ color }}>
                            {score}<span className="text-xs text-white/20">/100</span>
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                        {[
                            { label: 'Source IP', value: incident.source_ip || '—' },
                            { label: 'Events', value: incident.event_count ?? events.length },
                            { label: 'Status', value: incident.status || 'open' },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
                                <p className="text-[8px] text-white/25 uppercase tracking-wider mb-0.5">{label}</p>
                                <p className="text-xs font-bold text-white font-mono">{String(value).toUpperCase()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attack Timeline */}
                {sortedEvents.length > 0 && (
                    <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Attack Timeline · {sortedEvents.length} Events
                        </p>
                        <div className="space-y-1 max-h-48 overflow-y-auto hide-scrollbar">
                            {sortedEvents.map((evt, i) => {
                                const phase = PHASE_MAP[evt.event_type?.toLowerCase()] || 'unknown';
                                const phaseColor = PHASE_COLORS[phase];
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ background: phaseColor, boxShadow: `0 0 6px ${phaseColor}` }} />
                                        <span className="text-[9px] font-mono text-white/25 w-16 flex-shrink-0">
                                            {fmtTime(evt.timestamp)}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/60 flex-1 truncate">
                                            {evt.event_type?.replace(/_/g, ' ').toUpperCase() || 'EVENT'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-wider flex-shrink-0"
                                            style={{ color: phaseColor }}>
                                            {PHASE_LABELS[phase]}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Evidence */}
                <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> Evidence
                    </p>
                    <div className="font-mono text-[10px] leading-relaxed space-y-1">
                        {sortedEvents.slice(0, 6).map((evt, i) => (
                            <div key={i} className="flex items-start gap-2 text-white/40">
                                <span className="text-white/20 flex-shrink-0 w-14">{fmtTime(evt.timestamp)}</span>
                                <span className="text-white/50">{evt.event_type?.toUpperCase()}</span>
                                <span className="text-blue-400/60">→</span>
                                <span className="text-white/40">{evt.ip_address || evt.source_ip || '—'}</span>
                                {evt.username && <><span className="text-white/20">·</span><span className="text-orange-400/60">{evt.username}</span></>}
                                {evt.port_number && <span className="text-white/20">:{evt.port_number}</span>}
                            </div>
                        ))}
                        {sortedEvents.length > 6 && (
                            <p className="text-white/20 italic">+{sortedEvents.length - 6} more events…</p>
                        )}
                    </div>
                </div>

                {/* AI Narrative */}
                {incident.narrative && (
                    <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/15">
                        <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> AI Investigation
                        </p>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                            {incident.narrative}
                        </p>
                    </div>
                )}

                {/* SOAR Recommendations */}
                <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Recommended Response
                    </p>
                    <div className="space-y-2">
                        {actions.map((action, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                            >
                                <span>{action.icon}</span>
                                <span className="text-[11px] text-emerald-400/80 font-medium">{action.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default IncidentDrillDown;
