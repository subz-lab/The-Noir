import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const nodes = [
    { id: 'core',       label: 'Neural Core',      x: 50, y: 50, size: 40, color: '#2563EB', glow: 'rgba(37,99,235,0.5)',   type: 'center' },
    { id: 'ml',         label: 'ML Engine',        x: 25, y: 22, size: 28, color: '#7C3AED', glow: 'rgba(124,58,237,0.4)',  type: 'node' },
    { id: 'siem',       label: 'SIEM',             x: 75, y: 22, size: 28, color: '#0891B2', glow: 'rgba(8,145,178,0.4)',   type: 'node' },
    { id: 'soar',       label: 'SOAR',             x: 82, y: 60, size: 26, color: '#10B981', glow: 'rgba(16,185,129,0.4)',  type: 'node' },
    { id: 'threat',     label: 'Threat Intel',     x: 18, y: 60, size: 26, color: '#E11D48', glow: 'rgba(225,29,72,0.4)',   type: 'node' },
    { id: 'forensics',  label: 'Forensics',        x: 50, y: 82, size: 24, color: '#F59E0B', glow: 'rgba(245,158,11,0.4)',  type: 'node' },
    { id: 'log',        label: 'Log Ingest',       x: 35, y: 38, size: 18, color: '#6366F1', glow: 'rgba(99,102,241,0.3)',  type: 'small' },
    { id: 'automate',   label: 'Automation',       x: 65, y: 38, size: 18, color: '#06B6D4', glow: 'rgba(6,182,212,0.3)',   type: 'small' },
];

const edges = [
    ['core', 'ml'],    ['core', 'siem'],   ['core', 'soar'],
    ['core', 'threat'],['core', 'forensics'],
    ['ml',   'log'],   ['siem','automate'],
    ['soar', 'forensics'], ['threat', 'ml'],
    ['log',  'core'],  ['automate','core'],
];

const pct = (v) => `${v}%`;

const AutomationBrain = () => {
    const getNodePos = (id) => {
        const n = nodes.find(n => n.id === id);
        return n ? { x: n.x, y: n.y } : { x: 50, y: 50 };
    };

    return (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(37,99,235,0.08),transparent_70%)]" />

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {edges.map(([a, b], i) => {
                    const pa = getNodePos(a);
                    const pb = getNodePos(b);
                    return (
                        <motion.line
                            key={`${a}-${b}`}
                            x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="0.3"
                            strokeDasharray="1 1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.06 }}
                        />
                    );
                })}
                {edges.slice(0, 5).map(([a, b], i) => {
                    const pa = getNodePos(a);
                    const pb = getNodePos(b);
                    return (
                        <motion.circle
                            key={`pulse-${i}`}
                            r="0.8"
                            fill={nodes.find(n => n.id === a)?.color || '#2563EB'}
                            opacity={0.8}
                            animate={{
                                cx: [pa.x, pb.x, pa.x],
                                cy: [pa.y, pb.y, pa.y],
                            }}
                            transition={{
                                duration: 2.5 + i * 0.4,
                                repeat: Infinity,
                                ease: 'linear',
                                delay: i * 0.6,
                            }}
                        />
                    );
                })}
            </svg>

            {nodes.map((node, i) => (
                <motion.div
                    key={node.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                    style={{ left: pct(node.x), top: pct(node.y) }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 + 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                    whileHover={{ scale: 1.15 }}
                >
                    <motion.div
                        className="rounded-full flex items-center justify-center"
                        style={{
                            width: node.size,
                            height: node.size,
                            background: `radial-gradient(circle, ${node.color}30, ${node.color}08)`,
                            border: `1px solid ${node.color}50`,
                            boxShadow: `0 0 ${node.type === 'center' ? 20 : 10}px ${node.glow}`,
                        }}
                        animate={{
                            boxShadow: [
                                `0 0 ${node.type === 'center' ? 10 : 5}px ${node.glow}`,
                                `0 0 ${node.type === 'center' ? 25 : 15}px ${node.glow}`,
                                `0 0 ${node.type === 'center' ? 10 : 5}px ${node.glow}`,
                            ],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
                    >
                        <div className="rounded-full" style={{ width: node.size * 0.4, height: node.size * 0.4, background: node.color, opacity: 0.9 }} />
                    </motion.div>
                    <span
                        className="text-[7px] font-mono font-bold mt-1 opacity-50 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-wider"
                        style={{ color: node.color }}
                    >
                        {node.label}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};

export default AutomationBrain;
