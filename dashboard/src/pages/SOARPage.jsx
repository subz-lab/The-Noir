import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, PlayCircle, CheckCircle2, XCircle, Clock, Trash, Plus, X } from 'lucide-react';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import PageHeader from '../components/PageHeader';
import { fetchSOARPlaybooks, fetchActionHistory, deleteSOARPlaybook, createSOARPlaybook } from '../api';
import { useEffect } from 'react';

const SOARPage = () => {
    const [playbooks, setPlaybooks] = useState([]);
    const [actionHistory, setActionHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPbName, setNewPbName] = useState('');
    const [newPbTrigger, setNewPbTrigger] = useState('High Severity');
    const [newPbActionType, setNewPbActionType] = useState('block_ip');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [pbg, hist] = await Promise.all([fetchSOARPlaybooks(), fetchActionHistory()]);
            setPlaybooks(pbg);
            setActionHistory(hist);
        } catch { /* silent */ }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        loadData();
        const id = setInterval(loadData, 10000);
        return () => clearInterval(id);
    }, []);

    const handleDelete = async (id) => {
        try { await deleteSOARPlaybook(id); loadData(); } catch { /* silent */ }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createSOARPlaybook({
                name: newPbName,
                description: `Auto-response for ${newPbTrigger}`,
                trigger_type: newPbTrigger,
                is_active: true,
                actions: [{ name: newPbActionType, action_type: newPbActionType, params: {} }]
            });
            setIsCreating(false);
            setNewPbName('');
            loadData();
        } catch { /* silent */ }
    };

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                icon={Zap}
                iconColor="#2563EB"
                title="SOAR Orchestration"
                subtitle="Security Orchestration · Automation · Response"
                actions={
                    <button
                        onClick={() => setIsCreating(v => !v)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                        style={{
                            background: isCreating ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.9)',
                            border: '1px solid rgba(37,99,235,0.4)',
                            color: '#fff',
                            boxShadow: isCreating ? 'none' : '0 0 20px rgba(37,99,235,0.3)',
                        }}
                    >
                        {isCreating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isCreating ? 'Cancel' : 'New Playbook'}
                    </button>
                }
            />

            {/* Create Playbook Form */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 font-mono">
                                New Playbook Configuration
                            </p>
                            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Playbook Name</label>
                                    <input
                                        type="text" required value={newPbName}
                                        onChange={e => setNewPbName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="e.g. Isolate Infected Host"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Trigger Condition</label>
                                    <select value={newPbTrigger} onChange={e => setNewPbTrigger(e.target.value)}
                                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
                                        <option value="High Severity">High Severity Detection</option>
                                        <option value="Suspicious">Suspicious Activity</option>
                                        <option value="Brute Force">Brute Force</option>
                                        <option value="SQL Injection">SQL Injection</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Primary Action</label>
                                    <select value={newPbActionType} onChange={e => setNewPbActionType(e.target.value)}
                                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
                                        <option value="block_ip">Block Source IP</option>
                                        <option value="quarantine">Quarantine Host</option>
                                        <option value="send_email">Send Alert</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <button type="submit"
                                        className="px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                        Deploy Playbook
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SentinelGrid>
                {/* Active Playbooks */}
                <SentinelSection id="active-playbooks" colSpan="col-span-12 lg:col-span-8" title="Active Playbooks">
                    <div className="h-[420px] overflow-y-auto hide-scrollbar space-y-2 pr-1">
                        {isLoading && playbooks.length === 0 ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                            ))
                        ) : playbooks.length === 0 ? (
                            <div className="flex h-full items-center justify-center flex-col gap-3">
                                <Zap className="w-10 h-10 text-white/10" />
                                <p className="text-[11px] text-white/20 font-mono uppercase tracking-widest">No playbooks configured</p>
                            </div>
                        ) : playbooks.map((pb, i) => (
                            <motion.div key={pb.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="group flex items-center gap-4 px-5 py-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all"
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${pb.is_active ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/10'}`}>
                                    <PlayCircle className={`w-4 h-4 ${pb.is_active ? 'text-emerald-400' : 'text-white/20'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate">{pb.name}</h4>
                                    <p className="text-[10px] text-white/30 font-mono mt-0.5">
                                        TRIGGER: {pb.trigger_type} · {pb.actions?.length || 0} ACTION{pb.actions?.length !== 1 ? 'S' : ''}
                                    </p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${pb.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/20 border border-white/10'}`}>
                                    {pb.is_active ? 'Active' : 'Paused'}
                                </div>
                                <button onClick={() => handleDelete(pb.id)}
                                    className="p-2 opacity-0 group-hover:opacity-100 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                                    <Trash className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </SentinelSection>

                {/* Action History */}
                <SentinelSection id="action-history" colSpan="col-span-12 lg:col-span-4" title="Execution Log">
                    <div className="h-[420px] overflow-y-auto hide-scrollbar space-y-2 pr-1">
                        {actionHistory.length === 0 ? (
                            <div className="flex h-full items-center justify-center flex-col gap-3">
                                <Clock className="w-10 h-10 text-white/10" />
                                <p className="text-[11px] text-white/20 font-mono uppercase tracking-widest">No actions executed</p>
                            </div>
                        ) : actionHistory.map((log, i) => (
                            <motion.div key={log.id}
                                initial={{ opacity: 0, x: 6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5"
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {log.status === 'success'
                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        : <XCircle className="w-4 h-4 text-rose-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-white uppercase tracking-wide">
                                        {log.action_type?.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">{log.details}</p>
                                </div>
                                <span className="text-[9px] text-white/20 font-mono flex-shrink-0">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default SOARPage;
