import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Wifi, HardDrive, Activity } from 'lucide-react';
import TiltContainer from './3DTiltContainer';
import { fetchSystemHealth } from '../api';

const SystemHealth = () => {
    const [metrics, setMetrics] = useState([
        { label: 'CPU Load', value: '—', icon: Cpu, color: 'text-emerald-400' },
        { label: 'Network', value: '—', icon: Wifi, color: 'text-blue-400' },
        { label: 'Storage', value: '—', icon: HardDrive, color: 'text-orange-400' },
    ]);
    const [overall, setOverall] = useState('loading');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchSystemHealth();
                const m = data.metrics;
                setMetrics([
                    { label: m.cpu.label, value: `${m.cpu.value}%`, icon: Cpu, color: m.cpu.status === 'critical' ? 'text-rose-400' : m.cpu.status === 'warning' ? 'text-orange-400' : 'text-emerald-400' },
                    { label: m.network.label, value: `${m.network.recv_mb} MB`, icon: Wifi, color: 'text-blue-400' },
                    { label: m.disk.label, value: `${m.disk.value}%`, icon: HardDrive, color: m.disk.status === 'critical' ? 'text-rose-400' : m.disk.status === 'warning' ? 'text-orange-400' : 'text-orange-400' },
                ]);
                setOverall(data.overall);
            } catch (e) {
                console.error('SystemHealth fetch failed:', e);
            }
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    const statusColor = overall === 'critical' ? 'rose' : overall === 'warning' ? 'orange' : 'emerald';

    return (
        <TiltContainer className="h-full">
            <div className="h-full glass-premium rounded-[2.5rem] p-8 flex flex-col glow-edge-blue">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white font-grotesk tracking-tight">System Health</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Infrastructure pulse</p>
                    </div>
                    <Activity className={`w-5 h-5 text-${statusColor}-400`} />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {metrics.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="flex items-center gap-3">
                                <m.icon className={`w-4 h-4 ${m.color}`} />
                                <span className="text-xs font-bold text-white/80">{m.label}</span>
                            </div>
                            <span className="text-sm font-mono text-white">{m.value}</span>
                        </div>
                    ))}
                </div>

                <div className={`mt-8 p-4 rounded-2xl bg-${statusColor}-500/5 border border-${statusColor}-500/10`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-[9px] text-${statusColor}-400 font-black uppercase`}>Fleet Integrity</span>
                        <span className={`text-[9px] text-${statusColor}-400 font-mono`}>{overall === 'optimal' ? 'STABLE' : overall.toUpperCase()}</span>
                    </div>
                    <div className="flex gap-1">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className={`flex-1 h-3 bg-${statusColor}-500/20 rounded-sm`} />
                        ))}
                    </div>
                </div>
            </div>
        </TiltContainer>
    );
};

export default SystemHealth;
