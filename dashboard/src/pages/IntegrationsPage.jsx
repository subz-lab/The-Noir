import React from 'react';
import { motion } from 'framer-motion';
import { Link2, Cloud, Shield, Database, Lock, Hexagon, RefreshCcw, Power } from 'lucide-react';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';

const INTEGRATIONS = [
    {
        id: 'crowdstrike',
        name: 'CrowdStrike Falcon',
        type: 'EDR',
        status: 'active',
        lastSync: 'Just now',
        icon: Shield,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10'
    },
    {
        id: 'aws_cloudtrail',
        name: 'AWS CloudTrail',
        type: 'Cloud Infrastructure',
        status: 'active',
        lastSync: '2m ago',
        icon: Cloud,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10'
    },
    {
        id: 'splunk',
        name: 'Splunk Enterprise',
        type: 'SIEM',
        status: 'syncing',
        lastSync: 'Syncing...',
        icon: Database,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    },
    {
        id: 'okta',
        name: 'Okta Identity',
        type: 'IAM',
        status: 'active',
        lastSync: '5m ago',
        icon: Lock,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 'paloalto',
        name: 'Palo Alto Panorama',
        type: 'Network Security',
        status: 'disconnected',
        lastSync: '3 days ago',
        icon: Hexagon,
        color: 'text-neutral-500',
        bg: 'bg-neutral-500/10'
    }
];

const IntegrationsPage = () => {
    return (
        <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                        <Link2 className="w-6 h-6 text-fuchsia-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white font-grotesk tracking-tight">Data Connectors</h2>
                        <p className="text-sm text-white/40">Third-party telemetry ingestion points</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-5 py-3 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-tight hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        Add New Source
                    </button>
                    <button className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/60">
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <SentinelGrid>
                <SentinelSection id="connectors" colSpan="col-span-12" title="Active Integration Topology">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {INTEGRATIONS.map((integ, i) => (
                            <motion.div
                                key={integ.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-6 rounded-3xl border transition-all ${integ.status === 'active' || integ.status === 'syncing'
                                        ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                                        : 'bg-black/40 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl ${integ.bg} border border-white/10 flex items-center justify-center shadow-inner`}>
                                        <integ.icon className={`w-7 h-7 ${integ.color}`} />
                                    </div>

                                    <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${integ.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : integ.status === 'syncing' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                : 'bg-white/5 border-white/10 text-white/40'
                                        }`}>
                                        {integ.status === 'syncing' && <RefreshCcw className="w-3 h-3 animate-spin" />}
                                        {integ.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                        {integ.status}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold font-grotesk text-white tracking-tight mb-1">{integ.name}</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest font-bold">{integ.type}</p>

                                <div className="pt-6 mt-6 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Last Sync</span>
                                        <span className="text-sm font-mono text-white/80">{integ.lastSync}</span>
                                    </div>
                                    <button className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${integ.status !== 'disconnected'
                                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white'
                                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                        }`}>
                                        <Power className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default IntegrationsPage;
