import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, AlertCircle, Info, ChevronRight } from 'lucide-react';
import TiltContainer from './3DTiltContainer';
import { fetchTimeline } from '../api';

const TimelineEvent = ({ type, time, label, action, delay }) => {
    const icons = {
        threat: <AlertCircle className="w-4 h-4 text-rose-500" />,
        suspicious: <AlertCircle className="w-4 h-4 text-orange-400" />,
        mitigation: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        info: <Info className="w-4 h-4 text-blue-400" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="flex-shrink-0 w-72 h-full flex flex-col justify-end pb-8 relative border-l border-white/5 pl-8 group"
        >
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5" />
            <div className="absolute bottom-[-4px] left-[-4px] w-2 h-2 rounded-full bg-white/20 border border-white/10 z-10" />

            <div className="glass-premium rounded-3xl p-6 border border-white/5 group-hover:border-white/20 transition-all group-hover:translate-y-[-10px] bg-white/[0.02]">
                <div className="flex justify-between items-center mb-4">
                    <div className="p-2 rounded-xl bg-white/5">
                        {icons[type] || icons.info}
                    </div>
                    <span className="text-[10px] font-mono text-white/20">{time}</span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight mb-2 uppercase">{label}</h4>
                <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                    <p className="text-[10px] text-white/40 leading-relaxed italic">{action}</p>
                </div>

                <div className="mt-4 flex items-center gap-1 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black uppercase">View Details</span>
                    <ChevronRight className="w-3 h-3" />
                </div>
            </div>
        </motion.div>
    );
};

const AIThreatTimeline = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchTimeline();
                const mapped = data.events.map(ev => {
                    const ts = new Date(ev.timestamp);
                    const time = ts.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return {
                        type: ev.severity === 'threat' ? 'threat' : ev.severity === 'suspicious' ? 'suspicious' : 'info',
                        time,
                        label: ev.event_type.replace(/_/g, ' ').toUpperCase(),
                        action: ev.description,
                    };
                });
                setEvents(mapped);
            } catch (e) {
                console.error('Timeline fetch failed:', e);
            }
        };
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fallback if no events from backend
    const displayEvents = events.length > 0 ? events : [
        { type: 'info', time: '--:--:--', label: 'Awaiting Data', action: 'No threat events ingested yet. Run an attack simulation to see live data.' },
    ];

    return (
        <TiltContainer className="h-full">
            <div className="h-full glass-premium rounded-[2.5rem] p-8 flex flex-col glow-edge-emerald relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white font-grotesk tracking-tight">AI Decision Timeline</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Autonomous Response Stream</p>
                    </div>
                    <div className="flex gap-2">
                        <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto hide-scrollbar flex gap-2 pt-12">
                    {displayEvents.map((ev, i) => (
                        <TimelineEvent key={i} {...ev} delay={i * 0.1} />
                    ))}

                    <div className="absolute top-1/2 left-0 w-full h-[300px] bg-emerald-500/5 blur-[100px] pointer-events-none -translate-y-1/2 z-0" />
                </div>

                <div className="mt-4 flex justify-between items-center z-10">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                        {events.length > 0 ? `${events.length} events loaded` : 'Shift to reveal history'}
                    </span>
                    <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i === 4 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </TiltContainer>
    );
};

export default AIThreatTimeline;
