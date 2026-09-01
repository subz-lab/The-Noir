import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import PageHeader from '../components/PageHeader';
import LiveThreatMap from '../components/LiveThreatMap';
import NeuralThreatGraph from '../components/NeuralThreatGraph';
import { Fingerprint, Search, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

const ThreatIntelPage = ({ logs = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const assets = useMemo(() => {
        const ipMap = new Map();
        logs.forEach(log => {
            if (!log.ip_address) return;
            if (!ipMap.has(log.ip_address)) {
                ipMap.set(log.ip_address, {
                    ip: log.ip_address,
                    events: 0, threats: 0, suspicious: 0,
                    lastSeen: log.timestamp,
                    type: [80, 443].includes(log.port_number) ? 'Web Server'
                        : [5432, 27017, 3306].includes(log.port_number) ? 'Database'
                            : log.port_number === 22 ? 'SSH Node' : 'Endpoint'
                });
            }
            const asset = ipMap.get(log.ip_address);
            asset.events++;
            const lbl = (log.label || '').toUpperCase();
            if (['THREAT', 'CRITICAL'].includes(lbl)) asset.threats++;
            else if (['SUSPICIOUS', 'HIGH'].includes(lbl)) asset.suspicious++;
            if (new Date(log.timestamp) > new Date(asset.lastSeen)) asset.lastSeen = log.timestamp;
        });
        return Array.from(ipMap.values()).sort((a, b) => b.threats - a.threats || b.events - a.events);
    }, [logs]);

    const filtered = assets.filter(a =>
        a.ip.includes(searchTerm) || a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <PageHeader
                icon={Fingerprint}
                iconColor="#8B5CF6"
                title="Threat Intelligence"
                subtitle="Vector Mapping · Network Topology · Asset Inventory"
            />

            {/* Geo threat map */}
            <SentinelGrid className="mb-0">
                <SentinelSection id="geo-intel" colSpan="col-span-12" title="Active Vector Mapping">
                    <div className="h-[560px]">
                        <LiveThreatMap logs={logs} />
                    </div>
                </SentinelSection>
            </SentinelGrid>

            {/* 24h threat graph */}
            <SentinelGrid className="mb-0">
                <SentinelSection id="threat-graph" colSpan="col-span-12" title="24-Hour Threat Graph">
                    <div className="h-[340px]">
                        <NeuralThreatGraph logs={logs} />
                    </div>
                </SentinelSection>
            </SentinelGrid>

            {/* Asset inventory */}
            <SentinelGrid>
                <SentinelSection id="asset-inventory" colSpan="col-span-12" title="Protected Asset Topology">
                    <div className="flex items-center justify-between mb-5">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] font-mono">
                            {filtered.length} Node{filtered.length !== 1 ? 's' : ''} Monitored
                        </span>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type="text" placeholder="Search IP or type..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-5 py-2 text-xs focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all w-56 text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.length === 0 ? (
                            <div className="col-span-3 text-center py-14">
                                <Cpu className="w-10 h-10 mx-auto mb-3 text-white/10" />
                                <p className="text-[11px] font-mono text-white/20 uppercase tracking-widest">No assets detected</p>
                            </div>
                        ) : filtered.map((asset, i) => {
                            const hasThreat = asset.threats > 0;
                            const hasSusp = asset.suspicious > 0;
                            const statusColor = hasThreat ? '#E11D48' : hasSusp ? '#F59E0B' : '#10B981';
                            return (
                                <motion.div key={asset.ip}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="p-5 rounded-2xl border transition-colors hover:bg-white/[0.04]"
                                    style={{
                                        background: hasThreat ? 'rgba(225,29,72,0.04)' : 'rgba(255,255,255,0.02)',
                                        borderColor: hasThreat ? 'rgba(225,29,72,0.2)' : 'rgba(255,255,255,0.07)',
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                <Cpu className="w-4 h-4 text-white/40" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white font-mono">{asset.ip}</h3>
                                                <p className="text-[9px] text-white/30 uppercase tracking-widest">{asset.type}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                                            {hasThreat
                                                ? <ShieldAlert className="w-4 h-4" style={{ color: statusColor }} />
                                                : <ShieldCheck className="w-4 h-4" style={{ color: statusColor }} />}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {[
                                            { label: 'Total', value: asset.events, color: 'rgba(255,255,255,0.5)' },
                                            { label: 'Suspicious', value: asset.suspicious, color: '#F59E0B' },
                                            { label: 'Threats', value: asset.threats, color: '#E11D48' },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-center">
                                                <p className="text-[8px] text-white/20 uppercase tracking-wider mb-1">{label}</p>
                                                <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center text-[9px] font-mono text-white/20">
                                        <span>Last seen</span>
                                        <span>{new Date(asset.lastSeen).toLocaleTimeString([], { hour12: false })}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default ThreatIntelPage;
