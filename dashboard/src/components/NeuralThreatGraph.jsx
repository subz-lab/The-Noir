import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Server, Globe, ShieldAlert } from 'lucide-react';
import TiltContainer from './3DTiltContainer';
import { fetchTopology } from '../api';

const Node = ({ x, y, icon: Icon, label, status, delay, events, threats }) => {
    const colorClass = status === 'threat' ? 'text-rose-500' : status === 'suspicious' ? 'text-orange-400' : status === 'active' ? 'text-blue-400' : 'text-emerald-400';
    const bgClass = status === 'threat' ? 'bg-rose-500/10 border-rose-500/20' : status === 'suspicious' ? 'bg-orange-500/10 border-orange-500/20' : status === 'active' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
        >
            <div className={`p-4 rounded-2xl border ${bgClass} glass-premium backdrop-blur-[12px] flex flex-col items-center gap-2 group cursor-pointer transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`}>
                <div className="relative">
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                    {status === 'threat' && (
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full"
                        />
                    )}
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest max-w-[80px] truncate">{label}</p>
                    <p className={`text-[8px] font-mono ${colorClass}`}>{status.toUpperCase()}</p>
                    {events > 0 && (
                        <p className="text-[7px] text-white/20 font-mono">{events} events</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const Connection = ({ start, end, status }) => {
    const isThreat = status === 'threat';
    const color = isThreat ? 'rgba(244, 63, 94, 0.4)' : status === 'suspicious' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(16, 185, 129, 0.1)';

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <motion.line
                x1={`${start.x}%`} y1={`${start.y}%`}
                x2={`${end.x}%`} y2={`${end.y}%`}
                stroke={color}
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {isThreat && (
                <motion.circle
                    r="2"
                    fill="#f43f5e"
                >
                    <animateMotion
                        path={`M ${start.x * 0.01 * 600} ${start.y * 0.01 * 400} L ${end.x * 0.01 * 600} ${end.y * 0.01 * 400}`}
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </motion.circle>
            )}
        </svg>
    );
};

const NeuralThreatGraph = () => {
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchTopology();

                const mappedNodes = (data.nodes || []).map(node => ({
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    icon: node.type === 'server' ? Server : node.status === 'threat' ? ShieldAlert : Globe,
                    label: node.label,
                    status: node.status,
                    events: node.events || 0,
                    threats: node.threats || 0,
                }));

                const mappedConns = (data.connections || []).map(conn => {
                    const fromNode = mappedNodes.find(n => n.id === conn.from);
                    const toNode = mappedNodes.find(n => n.id === conn.to);
                    return fromNode && toNode ? { from: conn.from, to: conn.to, start: fromNode, end: toNode, status: conn.status } : null;
                }).filter(Boolean);

                setNodes(mappedNodes);
                setConnections(mappedConns);
            } catch (e) {
                console.error('Topology fetch failed:', e);
            }
        };
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    // Fallback static nodes if no data
    const displayNodes = nodes.length > 0 ? nodes : [
        { id: 'srv', x: 50, y: 50, icon: Server, label: 'Core', status: 'active', events: 0, threats: 0 },
    ];

    return (
        <TiltContainer className="h-full">
            <div className="h-full glass-premium rounded-[2.5rem] p-8 flex flex-col glow-edge-blue relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 z-20">
                    <div>
                        <h3 className="text-xl font-bold text-white font-grotesk tracking-tight">Neural Threat Graph</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Asset Topology Pulse</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[9px] font-black text-emerald-400 uppercase">
                            {nodes.length > 0 ? `${nodes.length} Nodes` : 'AI-Driven Analysis'}
                        </span>
                    </div>
                </div>

                <div className="flex-1 relative min-h-[400px]">
                    {connections.map((conn, i) => (
                        <Connection key={i} start={conn.start} end={conn.end} status={conn.status} />
                    ))}

                    {displayNodes.map((node, i) => (
                        <Node key={node.id} {...node} delay={i * 0.15} />
                    ))}

                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                    />
                </div>

                <div className="mt-6 flex gap-6 z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">Threat Detected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">Suspicious</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">Normal</span>
                    </div>
                </div>
            </div>
        </TiltContainer>
    );
};

export default NeuralThreatGraph;
