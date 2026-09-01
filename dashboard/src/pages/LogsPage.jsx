import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, RefreshCcw, Search, Filter } from 'lucide-react';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import Skeleton from '../components/Skeleton';

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

const LogsPage = ({ logs, isLoading, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = logs.filter(log =>
        (log.ip_address || '').includes(searchTerm) ||
        (log.event_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <HardDrive className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white font-grotesk tracking-tight">Access & Event Logs</h2>
                        <p className="text-sm text-white/40">Raw Neural Telemetry Feed & Audit Trail</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            type="text"
                            placeholder="Search IP, event, user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all w-64 text-white placeholder:text-white/20"
                        />
                    </div>
                    <button className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2 text-white/80">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button onClick={onRefresh} className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-black tracking-widest uppercase hover:opacity-90 transition-all flex items-center gap-2">
                        <RefreshCcw className="w-3 h-3" /> Sync
                    </button>
                </div>
            </div>

            <SentinelGrid>
                <SentinelSection id="log-table" colSpan="col-span-12" title="Global Ingestion Stream">
                    <div className="overflow-x-auto min-h-[500px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] text-white/40 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                    <th className="px-6 py-4 rounded-tl-xl">Timestamp</th>
                                    <th className="px-6 py-4">Node / IP</th>
                                    <th className="px-6 py-4">User Identity</th>
                                    <th className="px-6 py-4">Event Pulse</th>
                                    <th className="px-6 py-4">Port</th>
                                    <th className="px-6 py-4 text-center">Security Tag</th>
                                    <th className="px-6 py-4 text-right rounded-tr-xl">ML Confidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    [...Array(10)].map((_, i) => (
                                        <tr key={i}><td colSpan="7" className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
                                    ))
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center text-white/30 text-sm font-bold uppercase tracking-widest">
                                            No telemetry matched the filter
                                        </td>
                                    </tr>
                                ) : filteredLogs.map((log, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="hover:bg-white/[0.03] transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-xs font-mono text-white/40 whitespace-nowrap">
                                            {formatTime(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white text-sm tracking-tight">{log.ip_address}</td>
                                        <td className="px-6 py-4 text-xs text-white/60 font-mono">{log.user_id || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                                                {log.event_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-white/40">{log.port_number || '—'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${getSeverityColor(log.label)}`}>
                                                {log.label || 'NORMAL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(log.confidence || 0.9) * 100}%` }}
                                                        className={`h-full ${getSeverityColor(log.label).split(' ')[0].replace('text-', 'bg-')}`}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono text-white text-right w-8">{((log.confidence || 0.9) * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default LogsPage;
