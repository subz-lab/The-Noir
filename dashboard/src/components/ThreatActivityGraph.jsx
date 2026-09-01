import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import TiltContainer from './3DTiltContainer';

const ThreatActivityGraph = ({ data = [] }) => {
    return (
        <TiltContainer className="h-full">
            <div className="h-full glass-premium rounded-[2.5rem] p-8 flex flex-col glow-edge-blue">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white font-grotesk tracking-tight">Threat Velocity</h3>
                        <p className="text-xs text-white/30 mt-1 uppercase tracking-widest font-black">Neural Frequency Range</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase">+12.5%</span>
                    </div>
                </div>

                <div className="flex-1 flex items-end gap-2 px-2">
                    {[40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 75, 50].map((h, i) => (
                        <div key={i} className="flex-1 group relative">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: i * 0.05, duration: 1, ease: "circOut" }}
                                className="w-full bg-gradient-to-t from-blue-500/20 to-blue-400/60 rounded-t-lg relative overflow-hidden"
                            >
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                                    className="absolute inset-0 bg-white/20"
                                />
                            </motion.div>

                            {/* Hover Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 px-2 py-1 rounded-md z-10 pointer-events-none">
                                <span className="text-[10px] font-mono text-white whitespace-nowrap">{h}% Load</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowUpRight className="w-3 h-3 text-rose-400" />
                            <span className="text-[9px] text-white/30 uppercase font-black">Peak Pulse</span>
                        </div>
                        <p className="text-lg font-bold text-white font-grotesk">1,420 <span className="text-[10px] text-white/20 font-mono">ms</span></p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] text-white/30 uppercase font-black">Min Latency</span>
                        </div>
                        <p className="text-lg font-bold text-white font-grotesk">12 <span className="text-[10px] text-white/20 font-mono">ms</span></p>
                    </div>
                </div>
            </div>
        </TiltContainer>
    );
};

export default ThreatActivityGraph;
