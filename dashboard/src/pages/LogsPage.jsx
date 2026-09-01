import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, RefreshCcw, Search, Filter } from 'lucide-react';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';

const sev = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
};

const fmtTime = (ts) => {
    try {
        const d = new Date(ts);
        return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString([], { hour12: false })}`;
    } catch { return '—'; }
};

const LogsPage = ({ logs = [], isLoading, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('ALL');

    const filtered = logs.filter(log => {
        const matchSearch = (log.ip_address || '').includes(searchTerm)
            || (log.event_type || '').toLowerCase().includes(searchTerm.toLowerCase())
            || (log.user_id || '').toLowerCase().includes(searchTerm.toLowerCase())
            || (log.label || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterLabel === 'ALL' || (log.label || '').toUpperCase() === filterLabel;
        return matchSearch && matchFilter;
    });

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                icon={HardDrive}
                iconColor="#6366F1"
                title="Access & Event Logs"
                subtitle="Neural Telemetry Feed · Audit Trail"
                actions={<>
                    {/* Filter pills */}
                    <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-white/5">
                        {['ALL', 'THREAT', 'SUSPICIOUS', 'NORMAL'].map(f => (
                            <button key={f} onClick={() => setFilterLabel(f)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterLabel === f ? 'bg-white text-black shadow' : 'text-white/30 hover:text-white/60'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                        <input type="text" placeholder="IP, event, user..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs w-52 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all text-white placeholder:text-white/20" />
                    </div>
                    <button onClick={onRefresh}
                        className="p-2.5 rounded-xl bg-white text-black hover:opacity-90 transition-all">
                        <RefreshCcw className="w-3.5 h-3.5" />
                    </button>
                </>}
            />

            <SentinelGrid>
                <SentinelSection id="log-table" colSpan="col-span-12" title={`Ingestion Stream · ${filtered.length} entries`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] text-white/20 text-[9px] uppercase font-black tracking-[0.15em] border-b border-white/5">
                                    <th className="px-5 py-3">Timestamp</th>
                                    <th className="px-5 py-3">Node / IP</th>
                                    <th className="px-5 py-3">Identity</th>
                                    <th className="px-5 py-3">Event</th>
                                    <th className="px-5 py-3">Port</th>
                                    <th className="px-5 py-3 text-center">Tag</th>
                                    <th className="px-5 py-3 text-right">Confidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {isLoading ? (
                                    [...Array(10)].map((_, i) => (
                                        <tr key={i}><td colSpan="7" className="p-3"><Skeleton className="h-8 w-full rounded-lg" /></td></tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="7" className="py-16 text-center text-[11px] font-mono text-white/20 uppercase tracking-widest">
                                        No entries matched
                                    </td></tr>
                                ) : filtered.map((log, i) => {
                                    const conf = ((log.confidence || 0.9) * 100).toFixed(0);
                                    const confColor = sev(log.label).split(' ')[0].replace('text-', 'bg-');
                                    return (
                                        <motion.tr key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.015 }}
                                            className="hover:bg-white/[0.025] transition-colors group"
                                        >
                                            <td className="px-5 py-3.5 text-[10px] font-mono text-white/30 whitespace-nowrap">{fmtTime(log.timestamp)}</td>
                                            <td className="px-5 py-3.5 text-sm font-bold text-white font-mono">{log.ip_address}</td>
                                            <td className="px-5 py-3.5 text-[11px] text-white/40 font-mono">{log.user_id || '—'}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/8 text-[9px] font-mono text-white/50">
                                                    {log.event_type || '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-[11px] font-mono text-white/30">{log.port_number || '—'}</td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${sev(log.label)}`}>
                                                    {log.label || 'NORMAL'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-14 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${conf}%` }}
                                                            className={`h-full ${confColor}`}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-white w-7 text-right">{conf}%</span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default LogsPage;
