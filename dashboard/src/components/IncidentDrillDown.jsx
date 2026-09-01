import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Clock, Cpu, AlertTriangle, CheckCircle2, XCircle,
    ChevronRight, X, Zap, Lock, FileText, Check, ThumbsUp, ThumbsDown, Crosshair, Terminal
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
    brute_force: 'Credential Access',
    exploit: 'Exploitation',
    exfil: 'Exfiltration',
    persistence: 'Persistence',
    unknown: 'Unknown',
};

const PHASE_MAP = {
    port_access: 'recon', port_scan: 'recon', network_discovery: 'recon',
    login_failed: 'brute_force', login_attempt: 'brute_force', auth_failure: 'brute_force',
    sql_injection: 'exploit', api_request: 'exploit', web_request: 'exploit', xss_payload: 'exploit',
    data_access: 'exfil', file_download: 'exfil', db_dump: 'exfil',
    login_success: 'persistence', privilege_escalation: 'persistence', sudo_execution: 'persistence',
};

const SOAR_ACTIONS = {
    brute_force: [
        { icon: '🚫', text: 'Block source IP at edge firewall' },
        { icon: '🔒', text: 'Lock compromised user account' },
        { icon: '🔄', text: 'Revoke active OAuth & JWT sessions' },
        { icon: '🔑', text: 'Enforce credential reset & MFA challenge' },
        { icon: '🔍', text: 'Audit authentication logs across all nodes' },
    ],
    port_scan: [
        { icon: '🚫', text: 'Block scanning IP at boundary perimeter' },
        { icon: '📡', text: 'Apply rate limiting on probed port range' },
        { icon: '🔍', text: 'Review host exposure & close unused sockets' },
        { icon: '📢', text: 'Dispatch alert to Network Operations Center' },
    ],
    sql_injection: [
        { icon: '🚫', text: 'Immediately block source IP address' },
        { icon: '🛡️', text: 'Deploy WAF regex rule for SQL injection payloads' },
        { icon: '🗄️', text: 'Inspect query log for unauthorized DB extraction' },
        { icon: '🩹', text: 'Flag vulnerable endpoint for parameter sanitization' },
    ],
    credential_stuffing: [
        { icon: '🔒', text: 'Quarantine targeted accounts' },
        { icon: '🚫', text: 'Block distributed IP cluster' },
        { icon: '📱', text: 'Mandate hardware/TOTP 2FA authentication' },
        { icon: '🔑', text: 'Invalidate cached sessions' },
    ],
    default: [
        { icon: '🔍', text: 'Cross-reference IP against Threat Intel feeds' },
        { icon: '📢', text: 'Escalate to Tier 2 SOC analyst queue' },
        { icon: '📋', text: 'Export cryptographic log bundle for audit' },
        { icon: '🔒', text: 'Apply zero-trust network segmentation' },
    ],
};

const getSOARActions = (attackType = '') => {
    const t = attackType.toLowerCase();
    if (t.includes('brute') || t.includes('spray')) return SOAR_ACTIONS.brute_force;
    if (t.includes('port') || t.includes('scan')) return SOAR_ACTIONS.port_scan;
    if (t.includes('sql') || t.includes('injection')) return SOAR_ACTIONS.sql_injection;
    if (t.includes('credential') || t.includes('stuffing')) return SOAR_ACTIONS.credential_stuffing;
    return SOAR_ACTIONS.default;
};

/**
 * IncidentDrillDown — SIH-Grade Evidence & Investigation Panel
 *
 * Surfacing:
 *   - Risk scoring with volume bonus
 *   - MITRE ATT&CK Tactics & Techniques (TA0043, TA0006, TA0001, etc.)
 *   - Chronological Attack Timeline
 *   - Raw Payload & Feature Vector Evidence
 *   - Automated AI Narrative
 *   - Actionable SOAR Response Matrix
 *   - Human-in-the-Loop Analyst Verification Loop (True Positive / False Positive)
 */
const IncidentDrillDown = ({ incident, onClose }) => {
    const [feedbackStatus, setFeedbackStatus] = useState(incident?.feedback || null);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    if (!incident) return null;

    const score = incident.composite_score ?? incident.score ?? 50;
    const color = scoreColor(score);
    const sevLabel = scoreLabel(score);
    const actions = getSOARActions(incident.attack_type);

    const events = incident.events || [];
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Extract payloads if present
    const payloadEvents = sortedEvents.filter(e => e.request_payload || e.payload);

    const handleFeedback = async (verdict) => {
        setSubmittingFeedback(true);
        try {
            const res = await fetch(`${BASE_URL}/api/agents/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incident_id: incident.incident_id,
                    verdict: verdict,
                    notes: `Verified by SOC analyst via Incident Drill-Down`
                }),
            });
            if (res.ok) {
                setFeedbackStatus(verdict);
                incident.feedback = verdict;
            }
        } catch {
            // silent
        } finally {
            setSubmittingFeedback(false);
        }
    };

    return (
        <motion.div
            key={incident.incident_id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full flex flex-col overflow-hidden rounded-2xl border"
            style={{ background: 'rgba(8,8,10,0.96)', borderColor: `${color}35`, backdropFilter: 'blur(40px)' }}
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
                            {feedbackStatus && (
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${feedbackStatus === 'true_positive' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                    {feedbackStatus === 'true_positive' ? '✓ Verified Threat' : '✕ False Positive'}
                                </span>
                            )}
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

                {/* Risk Score & Primary Metadata */}
                <div className="p-4 rounded-xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Calculated Risk Index</span>
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
                            { label: 'Source Node', value: incident.source_ip || '—' },
                            { label: 'Target Entity', value: incident.target_user || 'Any Host' },
                            { label: 'Correlated Events', value: incident.event_count ?? events.length },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
                                <p className="text-[8px] text-white/25 uppercase tracking-wider mb-0.5">{label}</p>
                                <p className="text-xs font-bold text-white font-mono truncate">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MITRE ATT&CK Matrix Tagging */}
                {incident.mitre_tactics && incident.mitre_tactics.length > 0 && (
                    <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Crosshair className="w-3 h-3 text-purple-400" /> MITRE ATT&CK Mapping
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {incident.mitre_tactics.map((tactic, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/15 flex items-start gap-2.5">
                                    <span className="text-[9px] font-mono font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                        {tactic.id}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-white tracking-tight">{tactic.name}</p>
                                        <p className="text-[9px] font-mono text-white/40 truncate">{tactic.technique}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attack Progression Timeline */}
                {sortedEvents.length > 0 && (
                    <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Attack Sequence Timeline · {sortedEvents.length} Events
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar">
                            {sortedEvents.map((evt, i) => {
                                const phase = PHASE_MAP[evt.event_type?.toLowerCase()] || 'unknown';
                                const phaseColor = PHASE_COLORS[phase];
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ background: phaseColor, boxShadow: `0 0 6px ${phaseColor}` }} />
                                        <span className="text-[9px] font-mono text-white/30 w-16 flex-shrink-0">
                                            {fmtTime(evt.timestamp)}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/70 flex-1 truncate">
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

                {/* Raw Forensic Payload Evidence */}
                {payloadEvents.length > 0 && (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Terminal className="w-3 h-3" /> Captured Payload Snippet
                        </p>
                        <div className="space-y-1.5 font-mono text-[10px] text-rose-200/90 bg-black/40 p-3 rounded-lg border border-rose-500/20 overflow-x-auto">
                            {payloadEvents.slice(0, 3).map((e, idx) => (
                                <p key={idx} className="truncate">
                                    <span className="text-white/40">[{fmtTime(e.timestamp)}]</span> {e.request_payload || e.payload}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Evidence Summary Table */}
                <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> Supporting Telemetry Evidence
                    </p>
                    <div className="font-mono text-[10px] leading-relaxed space-y-1">
                        {sortedEvents.slice(0, 5).map((evt, i) => (
                            <div key={i} className="flex items-start gap-2 text-white/40">
                                <span className="text-white/20 flex-shrink-0 w-14">{fmtTime(evt.timestamp)}</span>
                                <span className="text-white/60">{evt.event_type?.toUpperCase()}</span>
                                <span className="text-blue-400/60">→</span>
                                <span className="text-white/50">{evt.ip_address || evt.source_ip || '—'}</span>
                                {evt.username && <><span className="text-white/20">·</span><span className="text-orange-400/80">{evt.username}</span></>}
                                {evt.port_number && <span className="text-white/30">:{evt.port_number}</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Narrative */}
                {incident.narrative && (
                    <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/15">
                        <p className="text-[9px] font-black text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> AI Investigation Narrative
                        </p>
                        <p className="text-[11px] text-white/60 leading-relaxed">
                            {incident.narrative}
                        </p>
                    </div>
                )}

                {/* SOAR Recommendations */}
                <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Actionable Mitigation Playbook
                    </p>
                    <div className="space-y-2">
                        {actions.map((action, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                            >
                                <span>{action.icon}</span>
                                <span className="text-[11px] text-emerald-400/90 font-medium">{action.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Human-in-the-Loop Analyst Verification / Feedback */}
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">
                        Analyst Feedback & Model Tuning
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleFeedback('true_positive')}
                            disabled={submittingFeedback || feedbackStatus === 'true_positive'}
                            className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${feedbackStatus === 'true_positive'
                                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {feedbackStatus === 'true_positive' ? 'Verified (True Positive)' : 'Confirm Threat'}
                        </button>
                        <button
                            onClick={() => handleFeedback('false_positive')}
                            disabled={submittingFeedback || feedbackStatus === 'false_positive'}
                            className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${feedbackStatus === 'false_positive'
                                ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'}`}
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            {feedbackStatus === 'false_positive' ? 'Flagged False Positive' : 'Mark False Positive'}
                        </button>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default IncidentDrillDown;
