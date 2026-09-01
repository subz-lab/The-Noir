import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import LiveThreatMap from '../components/LiveThreatMap';
import NeuralThreatGraph from '../components/NeuralThreatGraph';
import { Fingerprint, Search, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

const ThreatIntelPage = ({ logs = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Group logs by IP to simulate assets
    const assets = useMemo(() => {
        const ipMap = new Map();
        logs.forEach(log => {
            if (!log.ip_address) return;
            if (!ipMap.has(log.ip_address)) {
                ipMap.set(log.ip_address, {
                    ip: log.ip_address,
                    events: 0,
                    threats: 0,
                    suspicious: 0,
                    lastSeen: log.timestamp,
                    type: [80, 443].includes(log.port_number) ? 'Web Server'
                        : [5432, 27017, 3306].includes(log.port_number) ? 'Database'
                            : [22].includes(log.port_number) ? 'SSH Node'
                                : 'Endpoint'
                });
            }
            const asset = ipMap.get(log.ip_address);
            asset.events++;
            const lbl = (log.label || '').toUpperCase();
            if (['THREAT', 'CRITICAL'].includes(lbl)) asset.threats++;
            else if (['SUSPICIOUS', 'HIGH'].includes(lbl)) asset.suspicious++;
            if (new Date(log.timestamp) > new Date(asset.lastSeen)) {
                asset.lastSeen = log.timestamp;
            }
        });
        return Array.from(ipMap.values()).sort((a, b) => b.threats - a.threats || b.events - a.events);
    }, [logs]);

    const filteredAssets = assets.filter(a =>
        a.ip.includes(searchTerm) || a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Fingerprint className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white font-grotesk tracking-tight">Threat Intelligence</h2>
                    <p className="text-sm text-white/40">Global vector mapping, network topology, and asset inventory</p>
                </div>
            </div>

            <SentinelGrid className="mb-8">
                <SentinelSection id="geo-intel-full" colSpan="col-span-12" title="Active Vector Mapping">
                    <div className="h-[600px]">
                        <LiveThreatMap logs={logs} />
                    </div>
                </SentinelSection>
            </SentinelGrid>

            <SentinelGrid className="mb-8">
                <SentinelSection id="network-topology-full" colSpan="col-span-12" title="Semantic Network Topology Map">
                    <div className="h-[500px]">
                        <NeuralThreatGraph />
                    </div>
                </SentinelSection>
            </SentinelGrid>

            {/* Asset Inventory (merged from AssetsPage) */}
            <SentinelGrid>
                <SentinelSection id="asset-inventory" colSpan="col-span-12" title="Protected Asset Topology">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
                            {filteredAssets.length} Monitored Node{filteredAssets.length !== 1 ? 's' : ''}
                        </p>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type="text"
                                placeholder="Search IP or Type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all w-64 text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredAssets.length === 0 ? (
                            <div className="col-span-12 text-center py-16 text-white/30 uppercase tracking-widest font-bold">
                                No assets detected in telemetry
                            </div>
                        ) : (
                            filteredAssets.map((asset, i) => {
                                const statusColor = asset.threats > 0 ? 'text-rose-400' : asset.suspicious > 0 ? 'text-orange-400' : 'text-emerald-400';
                                const statusBg = asset.threats > 0 ? 'bg-rose-500/10 border-rose-500/20' : asset.suspicious > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20';
                                return (
                                    <motion.div
                                        key={asset.ip}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`p-6 rounded-3xl border ${asset.threats > 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'} hover:bg-white/10 transition-colors flex flex-col`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center">
                                                    <Cpu className="w-5 h-5 text-white/60" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white tracking-tight">{asset.ip}</h3>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{asset.type}</p>
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded-xl border ${statusBg} ${statusColor}`}>
                                                {asset.threats > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                                                <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Total</p>
                                                <p className="font-mono text-white text-sm">{asset.events}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                                                <p className="text-[9px] text-orange-400/50 uppercase tracking-widest mb-1">Suspicious</p>
                                                <p className="font-mono text-orange-400 text-sm">{asset.suspicious}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                                                <p className="text-[9px] text-rose-400/50 uppercase tracking-widest mb-1">Threats</p>
                                                <p className="font-mono text-rose-400 text-sm">{asset.threats}</p>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono text-white/30">
                                            <span>Last Pulse:</span>
                                            <span>{new Date(asset.lastSeen).toLocaleTimeString()}</span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default ThreatIntelPage;
