import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Shield, Activity, MapPin } from 'lucide-react';

/**
 * Production-Ready Threat Monitoring Globe.
 * Displays real data from ingested logs.
 */
const LiveThreatMap = ({ logs = [] }) => {
    // Generate blips from actual log data
    const activeBlips = useMemo(() => {
        // Deduplicate by IP and pick the most severe label
        const ipMap = new Map();
        logs.forEach(log => {
            const ip = log.ip_address || 'unknown';
            if (!ipMap.has(ip)) {
                ipMap.set(ip, {
                    ip,
                    label: log.label || 'Normal',
                    event_type: log.event_type || 'unknown',
                    confidence: log.confidence || 0,
                    count: 1
                });
            } else {
                const existing = ipMap.get(ip);
                existing.count++;
                // Escalate: Threat > Suspicious > Normal
                const rank = { 'Threat': 3, 'Suspicious': 2, 'Normal': 1 };
                if ((rank[log.label] || 0) > (rank[existing.label] || 0)) {
                    existing.label = log.label;
                }
            }
        });

        return Array.from(ipMap.values()).slice(0, 12).map((entry, i) => ({
            id: i,
            // Distribute blips in a visually spread-out pattern
            x: 8 + ((i * 37 + 13) % 84),
            y: 12 + ((i * 29 + 7) % 76),
            severity: entry.label === 'Threat' ? 'critical' : entry.label === 'Suspicious' ? 'warning' : 'normal',
            origin: entry.ip,
            events: entry.count,
            label: entry.label
        }));
    }, [logs]);

    // Compute real stats from logs
    const stats = useMemo(() => {
        const total = logs.length;
        const threats = logs.filter(l => l.label === 'Threat').length;
        const suspicious = logs.filter(l => l.label === 'Suspicious').length;
        const blocked = threats + suspicious;
        const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0';
        const uniqueIPs = new Set(logs.map(l => l.ip_address)).size;

        return {
            probes: uniqueIPs > 0 ? uniqueIPs.toLocaleString() : '—',
            blockRate: total > 0 ? `${blockRate}%` : '—',
            detections: blocked > 0 ? blocked.toLocaleString() : '0',
            total: total > 0 ? total.toLocaleString() : '0'
        };
    }, [logs]);

    return (
        <div className="relative h-[600px] flex flex-col bg-[#0A0A0C]/40 border border-white/[0.05] rounded-[2rem] overflow-hidden p-8 shadow-2xl">
            {/* Header Telemetry */}
            <div className="relative z-20 flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase font-outfit">Global Vector Sync</h2>
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black italic">
                        Monitoring {activeBlips.length > 0 ? `${activeBlips.length} Active Nodes` : 'Awaiting Telemetry'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Neural Link: ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* SaaS Centerpiece: Abstract Tech Globe */}
            <div className="flex-1 relative flex items-center justify-center pointer-events-none">
                {/* Visual Atmosphere: Subtle Ring Patterns */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-[450px] h-[450px] rounded-full border border-white/5 ring-1 ring-white/5 shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                    <div className="absolute w-[550px] h-[550px] rounded-full border border-white/5 ring-1 ring-white/5 scale-[1.1] opacity-50" />
                </div>

                {/* Active Threat Grid */}
                <div className="absolute inset-0">
                    {activeBlips.map((blip) => (
                        <motion.div
                            key={blip.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: blip.id * 0.1 }}
                            className="absolute"
                            style={{ left: `${blip.x}%`, top: `${blip.y}%` }}
                        >
                            <div className="relative flex items-center justify-center">
                                <div className={`absolute inset-0 w-8 h-8 rounded-full blur-[4px] animate-ping ${
                                    blip.severity === 'critical' ? 'bg-rose-500/40' 
                                    : blip.severity === 'warning' ? 'bg-orange-400/30' 
                                    : 'bg-blue-400/20'
                                }`} />
                                <div className={`w-2.5 h-2.5 rounded-full border border-white/30 ${
                                    blip.severity === 'critical' ? 'bg-rose-500' 
                                    : blip.severity === 'warning' ? 'bg-orange-400' 
                                    : 'bg-emerald-400'
                                }`} />
                                <div className={`absolute top-4 left-4 border px-2 py-1 rounded text-[8px] font-bold uppercase whitespace-nowrap backdrop-blur-md ${
                                    blip.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                    : blip.severity === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                                    : 'bg-[#0A0A0C]/80 border-white/5 text-white'
                                }`}>
                                    {blip.origin} <span className="text-white/30 ml-1">({blip.events})</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <Globe className="w-96 h-96 text-white/[0.03] animate-pulse" />
            </div>

            {/* Footer Stats Bar — Real Data */}
            <div className="relative z-20 mt-8 grid grid-cols-4 gap-8 pt-8 border-t border-white/5">
                <StatItem label="Unique Sources" val={stats.probes} />
                <StatItem label="Threat Rate" val={stats.blockRate} color="text-rose-400" />
                <StatItem label="Events Analyzed" val={stats.total} />
                <StatItem label="Detections" val={stats.detections} color="text-orange-400" />
            </div>
        </div>
    );
};

const StatItem = ({ label, val, color = 'text-white' }) => (
    <div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1">{label}</p>
        <p className={`text-sm font-bold tracking-tight ${color}`}>{val}</p>
    </div>
);

export default LiveThreatMap;
