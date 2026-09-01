import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, AlertCircle, Shield, Scan, Code, File } from 'lucide-react';
import { fetchPlaybooks } from '../api';

/**
 * PlaybookFlow: Visualizes automation trigger chains and states from real backend data.
 */
const PlaybookFlow = () => {
    const [playbooks, setPlaybooks] = useState([]);
    const [stats, setStats] = useState({ total_events: 0, total_threats: 0, automation_rate: 0 });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchPlaybooks();
                setPlaybooks(data.playbooks || []);
                setStats({
                    total_events: data.total_events || 0,
                    total_threats: data.total_threats || 0,
                    automation_rate: data.automation_rate || 0,
                });
            } catch (e) {
                console.error('Playbooks fetch failed:', e);
            }
        };
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    const iconMap = {
        shield: Shield,
        scan: Scan,
        code: Code,
        file: File,
    };

    const chain = playbooks.length > 0 ? playbooks.map(pb => ({
        label: pb.name.split(' ').slice(0, 2).join(' '),
        status: pb.status === 'active' ? (pb.threats_caught > 0 ? 'active' : 'success') : 'pending',
        events: pb.events_processed,
        threats: pb.threats_caught,
    })) : [
        { label: 'Brute Force', status: 'pending', events: 0, threats: 0 },
        { label: 'Port Scan', status: 'pending', events: 0, threats: 0 },
        { label: 'SQL Injection', status: 'pending', events: 0, threats: 0 },
        { label: 'File Monitor', status: 'pending', events: 0, threats: 0 },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight font-outfit">Automation Brain</h3>
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase italic">
                    {stats.total_threats > 0 ? `${stats.total_threats} Threats Caught` : 'Standby'}
                </span>
            </div>

            <div className="flex items-center justify-between relative py-6 px-4">
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -translate-y-1/2" />

                {chain.map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${step.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                                step.status === 'active' ? 'bg-blue-500/20 border-blue-400 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] animate-pulse' :
                                    'bg-white/5 border-white/10 text-white/20'
                                }`}
                        >
                            {step.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                step.status === 'active' ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}><Play className="w-5 h-5" /></motion.div> :
                                    <AlertCircle className="w-5 h-5" />}
                        </motion.div>
                        <p className={`mt-4 text-[9px] font-bold uppercase tracking-widest ${step.status === 'active' ? 'text-blue-400' : 'text-white/30'
                            }`}>
                            {step.label}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Events Processed</p>
                    <p className="text-xl font-bold text-white font-outfit">{stats.total_events.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Threat Rate</p>
                    <p className="text-xl font-bold text-white font-outfit">{stats.automation_rate}%</p>
                </div>
            </div>
        </div>
    );
};

export default PlaybookFlow;
