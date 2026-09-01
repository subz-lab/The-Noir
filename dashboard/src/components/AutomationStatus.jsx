import React from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, RefreshCcw, Command } from 'lucide-react';
import TiltContainer from './3DTiltContainer';

const AutomationStatus = () => {
    const playbooks = [
        { name: 'Brute-Force Inhibitor', status: 'Running', progress: 65, color: 'bg-blue-400' },
        { name: 'Neural Patch Deployer', status: 'Active', progress: 92, color: 'bg-emerald-400' },
        { name: 'Vector Isolation', status: 'Queue', progress: 12, color: 'bg-white/20' },
    ];

    return (
        <TiltContainer className="h-full">
            <div className="h-full glass-premium rounded-[2.5rem] p-8 flex flex-col glow-edge-blue">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white font-grotesk tracking-tight">Automation Engine</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Active Playbooks</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <Command className="w-4 h-4 text-white/40" />
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    {playbooks.map((pb, i) => (
                        <div key={i} className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-xs font-bold text-white">{pb.name}</h4>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">{pb.status}</p>
                                </div>
                                <span className="text-[10px] font-mono text-white/60">{pb.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pb.progress}%` }}
                                    transition={{ duration: 1.5, delay: i * 0.2 }}
                                    className={`h-full ${pb.color} rounded-full`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <button className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <Play className="w-3 h-3 fill-current" />
                        Launch New Playbook
                    </button>
                </div>
            </div>
        </TiltContainer>
    );
};

export default AutomationStatus;
