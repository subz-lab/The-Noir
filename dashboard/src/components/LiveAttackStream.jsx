import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const severityStyle = {
    THREAT:     { color: '#E11D48', bg: 'rgba(225,29,72,0.12)',   label: 'THREAT',     badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    CRITICAL:   { color: '#E11D48', bg: 'rgba(225,29,72,0.12)',   label: 'CRITICAL',   badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    SUSPICIOUS: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  label: 'SUSPICIOUS', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    HIGH:       { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  label: 'HIGH',       badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    NORMAL:     { color: '#10B981', bg: 'rgba(16,185,129,0.06)',  label: 'NORMAL',     badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    SAFE:       { color: '#10B981', bg: 'rgba(16,185,129,0.06)',  label: 'SAFE',       badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const MOCK_LOGS = [
    { label: 'THREAT',     ip: '203.0.113.10', event: 'SQL_INJECTION',       port: 5432,  confidence: 0.97 },
    { label: 'NORMAL',     ip: '10.0.1.42',    event: 'HTTP_REQUEST',        port: 80,    confidence: 0.12 },
    { label: 'SUSPICIOUS', ip: '185.220.101.8', event: 'PORT_SCAN',          port: 22,    confidence: 0.78 },
    { label: 'THREAT',     ip: '198.51.100.5', event: 'BRUTE_FORCE_SSH',     port: 22,    confidence: 0.95 },
    { label: 'NORMAL',     ip: '192.168.1.15',  event: 'DNS_LOOKUP',         port: 53,    confidence: 0.05 },
    { label: 'SUSPICIOUS', ip: '104.21.19.2',   event: 'DDOS_ATTEMPT',       port: 443,   confidence: 0.82 },
    { label: 'THREAT',     ip: '45.33.32.156',  event: 'CREDENTIAL_STUFFING',port: 8080,  confidence: 0.91 },
    { label: 'NORMAL',     ip: '10.0.0.1',      event: 'HEARTBEAT',          port: 3000,  confidence: 0.02 },
];

const formatTs = () => {
    const now = new Date();
    return `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')}`;
};

const LiveAttackStream = ({ logs = [] }) => {
    const [stream, setStream] = useState([]);
    const bottomRef = useRef(null);

    // Seed with real logs + add incoming entries
    useEffect(() => {
        const seed = (logs.length > 0 ? logs : MOCK_LOGS).slice(0, 12).map((l, i) => ({
            ...l,
            _ts: formatTs(),
            _key: `seed-${i}`,
        }));
        setStream(seed.reverse());
    }, [logs]);

    // Simulate live incoming logs
    useEffect(() => {
        const pool = logs.length > 0 ? logs : MOCK_LOGS;
        const interval = setInterval(() => {
            const entry = pool[Math.floor(Math.random() * pool.length)];
            setStream(prev => [
                { ...entry, _ts: formatTs(), _key: `live-${Date.now()}` },
                ...prev.slice(0, 40),
            ]);
        }, 1800);
        return () => clearInterval(interval);
    }, [logs]);

    return (
        <div className="relative h-full flex flex-col scanline-overlay">
            {/* Terminal header bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05] bg-black/20 flex-shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] font-mono text-white/20 ml-2">noir://threat-stream.live</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">STREAMING</span>
                </div>
            </div>

            {/* Log feed */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-1 relative z-10">
                <AnimatePresence>
                    {stream.map((entry, i) => {
                        const lbl = (entry.label || 'NORMAL').toUpperCase();
                        const cfg = severityStyle[lbl] || severityStyle.NORMAL;
                        const conf = ((entry.confidence || 0.5) * 100).toFixed(0);

                        return (
                            <motion.div
                                key={entry._key || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-mono group"
                                style={{ background: i === 0 ? cfg.bg : 'transparent' }}
                            >
                                {/* Timestamp */}
                                <span className="text-white/20 flex-shrink-0 w-[58px] text-[10px]">{entry._ts}</span>

                                {/* Severity badge */}
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border flex-shrink-0 ${cfg.badge}`}>
                                    {cfg.label}
                                </span>

                                {/* IP + Event */}
                                <span style={{ color: cfg.color }} className="flex-shrink-0 font-bold">
                                    {entry.ip_address || entry.ip}
                                </span>
                                <span className="text-white/30 flex-shrink-0">→</span>
                                <span className="text-white/50 truncate">{(entry.event_type || entry.event || 'UNKNOWN').replace(/_/g, ' ')}</span>

                                {/* Port */}
                                <span className="ml-auto text-white/20 flex-shrink-0">:{entry.port_number || entry.port || '?'}</span>

                                {/* Confidence */}
                                <span className="text-white/20 flex-shrink-0 w-[36px] text-right">{conf}%</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Blinking cursor at bottom */}
                <div className="flex items-center gap-1 px-3 py-1">
                    <span className="text-emerald-400 text-[11px] font-mono">noir@sentinel:~$</span>
                    <span className="w-2 h-[13px] bg-emerald-400 cursor-blink" />
                </div>
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default LiveAttackStream;
