import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, PlayCircle, ShieldIcon, CheckCircle2, XCircle, Clock, Trash, Plus } from 'lucide-react';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import { fetchSOARPlaybooks, fetchActionHistory, deleteSOARPlaybook, createSOARPlaybook } from '../api';

const SOARPage = () => {
    const [playbooks, setPlaybooks] = useState([]);
    const [actionHistory, setActionHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // New Playbook Form State
    const [newPbName, setNewPbName] = useState('');
    const [newPbTrigger, setNewPbTrigger] = useState('High Severity');
    const [newPbActionType, setNewPbActionType] = useState('block_ip');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [pbg, hist] = await Promise.all([
                fetchSOARPlaybooks(),
                fetchActionHistory()
            ]);
            setPlaybooks(pbg);
            setActionHistory(hist);
        } catch (e) {
            console.error("Failed to load SOAR data", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteSOARPlaybook(id);
            loadData();
        } catch (e) {
            console.error("Failed to delete playbook", e);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const pbData = {
                name: newPbName,
                description: `Automatically created via Dashboard for ${newPbTrigger}`,
                trigger_type: newPbTrigger,
                is_active: true,
                actions: [
                    {
                        name: `Action: ${newPbActionType}`,
                        action_type: newPbActionType,
                        params: {}
                    }
                ]
            };
            await createSOARPlaybook(pbData);
            setIsCreating(false);
            setNewPbName('');
            loadData();
        } catch (e) {
            console.error("Failed to create playbook", e);
        }
    };

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white font-grotesk tracking-tight">SOAR Orchestration</h2>
                        <p className="text-sm text-white/40">Security Orchestration, Automation, and Response playbooks</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Playbook
                </button>
            </div>

            {isCreating && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl"
                >
                    <h3 className="text-lg font-bold text-white mb-4">Create New Playbook</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-wrap">
                        <div>
                            <label className="block text-xs font-bold text-white/50 mb-1">Playbook Name</label>
                            <input 
                                type="text" 
                                required
                                value={newPbName}
                                onChange={(e) => setNewPbName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                placeholder="e.g. Isolate Infected Host"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/50 mb-1">Trigger condition</label>
                            <select 
                                value={newPbTrigger}
                                onChange={(e) => setNewPbTrigger(e.target.value)}
                                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            >
                                <option value="High Severity">High Severity Detections</option>
                                <option value="Suspicious">Suspicious Detections</option>
                                <option value="Brute Force">Brute Force</option>
                                <option value="SQL Injection">SQL Injection</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-white/50 mb-1">Primary Action Type</label>
                            <select 
                                value={newPbActionType}
                                onChange={(e) => setNewPbActionType(e.target.value)}
                                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            >
                                <option value="block_ip">Block Source IP</option>
                                <option value="quarantine">Quarantine Host</option>
                                <option value="send_email">Send Email Alert</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                             <button 
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all"
                            >
                                Save & Activate
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <SentinelGrid className="mb-8">
                <SentinelSection id="active-playbooks" colSpan="col-span-12 lg:col-span-8" title="Active Playbooks">
                    <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {isLoading && playbooks.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-white/30">Loading playbooks...</div>
                        ) : playbooks.length === 0 ? (
                             <div className="flex h-full items-center justify-center text-white/30">No active playbooks found. Create one above.</div>
                        ) : (
                            <div className="space-y-3">
                                {playbooks.map(pb => (
                                    <div key={pb.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pb.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                                                <PlayCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">{pb.name}</h4>
                                                <p className="text-xs text-white/40">Triggers on: <span className="text-white/70">{pb.trigger_type}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                             <div className="text-right hidden md:block text-xs text-white/50">
                                                {pb.actions.length} Action{pb.actions.length !== 1 ? 's' : ''} Configured
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(pb.id)}
                                                className="p-2 text-rose-500/0 group-hover:text-rose-500/50 hover:!text-rose-500 transition-colors rounded-lg hover:bg-rose-500/10"
                                                title="Delete Playbook"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SentinelSection>

                 <SentinelSection id="action-history" colSpan="col-span-12 lg:col-span-4" title="Recent Actions">
                    <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {actionHistory.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-white/30 text-sm text-center">No automated actions have been executed yet.</div>
                         ) : (
                             <div className="space-y-4">
                                 {actionHistory.map(log => (
                                     <div key={log.id} className="relative pl-6 before:absolute before:left-[11px] before:top-6 before:bottom-[-20px] before:w-0.5 before:bg-white/5 last:before:hidden">
                                         <div className="absolute left-0 top-1 w-[24px] h-[24px] rounded-full bg-[#0a0a0c] border-4 border-[#020204] flex items-center justify-center z-10">
                                            {log.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                                         </div>
                                         <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl ml-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-white">{log.action_type.toUpperCase().replace('_', ' ')}</span>
                                                <span className="text-[10px] text-white/40 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/60 leading-relaxed">{log.details}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                 </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default SOARPage;
