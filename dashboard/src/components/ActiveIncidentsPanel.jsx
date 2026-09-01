import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import TiltContainer from './3DTiltContainer';

const ActiveIncidentsPanel = ({ incidents = [] }) => {
    return (
        <TiltContainer className="h-full">
            <div className="h-full glass-premium rounded-[2.5rem] p-8 flex flex-col glow-edge-rose">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white font-grotesk tracking-tight">Active Incidents</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Forensic Queue</p>
                    </div>
                    <span className="px-4 py-1 rounded-full bg-rose-500 text-black text-[10px] font-black uppercase">
                        {incidents.length} CRITICAL
                    </span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2 hide-scrollbar">
                    {incidents.slice(0, 5).map((inc, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-500 uppercase">
                                    {inc.severity_label || 'CRITICAL'}
                                </span>
                                <span className="text-[9px] font-mono text-white/20">#{inc.report_id?.slice(0, 8)}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                                {inc.source_ip || inc.log_data?.ip_address || 'Internal Server Hub'}
                            </h4>
                            <div className="flex gap-4 mt-3">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-white/20" />
                                    <span className="text-[10px] text-white/40 font-mono">12m</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-white/20" />
                                    <span className="text-[10px] text-white/40 font-mono">DE-FRA-01</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {incidents.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                            <AlertTriangle className="w-12 h-12 mb-4" />
                            <p className="text-sm font-bold">No active incidents</p>
                        </div>
                    )}
                </div>
            </div>
        </TiltContainer>
    );
};

export default ActiveIncidentsPanel;
