import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Activity, Cpu } from 'lucide-react';

const AutomationBrain = () => {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-deep rounded-[2.5rem] p-10 holographic-glow relative overflow-hidden h-[450px]"
        >
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Brain className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight uppercase">Automation Brain</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black italic">Active Playbook Cluster: ALPHA-9</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
                    <Zap className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Processing Core</span>
                </div>
            </div>

            {/* Neural Pathway Visualization (SVG) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <svg width="400" height="300" viewBox="0 0 400 300" className="w-full h-full p-12">
                    <defs>
                        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    {/* Placeholder for neural lines */}
                    <motion.path
                        d="M 50 150 Q 200 50 350 150"
                        stroke="url(#line-grad)"
                        strokeWidth="2"
                        fill="transparent"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path
                        d="M 50 150 Q 200 250 350 150"
                        stroke="url(#line-grad)"
                        strokeWidth="2"
                        fill="transparent"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                    />
                    <motion.circle
                        cx="200" cy="150" r="40"
                        stroke="#6366f1" strokeWidth="1" fill="transparent"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                </svg>
            </div>

            <div className="grid grid-cols-2 gap-6 relative z-10 mt-12">
                {[
                    { label: 'Neural Throughput', val: '8.4 GB/s', icon: Activity, color: 'text-indigo-400' },
                    { label: 'Decision Latency', val: '0.42 ms', icon: Cpu, color: 'text-emerald-400' },
                    { label: 'Active Neurons', val: '14,240', icon: Brain, color: 'text-white/60' },
                    { label: 'Trigger Chains', val: '158', icon: Zap, color: 'text-rose-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl hover:bg-white/[0.05] transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <stat.icon className={`w-3.5 h-3.5 ${stat.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">{stat.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white font-outfit">{stat.val}</p>
                    </motion.div>
                ))}
            </div>

            <div className="absolute bottom-8 left-10 right-10 flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black italic">Brain-Sync: Synchronized</span>
                </div>
                <button className="text-[10px] text-indigo-400 font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group">
                    View Network Atlas
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>→</motion.span>
                </button>
            </div>
        </motion.div>
    );
};

export default AutomationBrain;
