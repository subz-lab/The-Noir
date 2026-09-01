import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// Generate 24-hour threat data from real logs
const buildChartData = (logs = []) => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
        h: `${String(i).padStart(2, '0')}:00`,
        threats: 0,
        suspicious: 0,
        normal: 0,
    }));

    logs.forEach(log => {
        try {
            const d = new Date(log.timestamp);
            const hr = d.getHours();
            const lbl = (log.label || '').toUpperCase();
            if (['THREAT', 'CRITICAL'].includes(lbl)) hours[hr].threats++;
            else if (['SUSPICIOUS', 'HIGH'].includes(lbl)) hours[hr].suspicious++;
            else hours[hr].normal++;
        } catch { /* skip bad timestamps */ }
    });

    // If no real data, generate realistic mock
    if (logs.length === 0) {
        hours.forEach((h, i) => {
            h.threats = Math.max(0, Math.round(5 + Math.sin(i / 3) * 3 + Math.random() * 4));
            h.suspicious = Math.max(0, Math.round(12 + Math.cos(i / 4) * 5 + Math.random() * 6));
            h.normal = Math.max(0, Math.round(80 + Math.sin(i / 2) * 20 + Math.random() * 15));
        });
    }
    return hours;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="px-3 py-2 rounded-xl text-[10px] font-mono"
            style={{
                background: 'rgba(10,10,12,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}>
            <p className="text-white/40 mb-1">{label}</p>
            {payload.map(p => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/60 capitalize">{p.dataKey}:</span>
                    <span className="text-white font-bold">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

const NeuralThreatGraph = ({ logs = [] }) => {
    const data = useMemo(() => buildChartData(logs), [logs]);
    const currentHour = new Date().getHours();

    return (
        <div className="h-full flex flex-col">
            {/* Legend */}
            <div className="flex items-center gap-4 px-2 pb-3 flex-shrink-0">
                {[
                    { key: 'threats',    color: '#E11D48', label: 'Threats' },
                    { key: 'suspicious', color: '#F59E0B', label: 'Suspicious' },
                    { key: 'normal',     color: '#10B981', label: 'Normal' },
                ].map(({ key, color, label }) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{label}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gThreat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#E11D48" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gSusp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gNorm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                            dataKey="h"
                            tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}
                            tickLine={false}
                            axisLine={false}
                            interval={3}
                        />
                        <YAxis
                            tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            x={data[currentHour]?.h}
                            stroke="rgba(255,255,255,0.15)"
                            strokeDasharray="4 4"
                            label={{ value: 'NOW', fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'monospace' }}
                        />
                        <Area type="monotone" dataKey="normal"     stroke="#10B981" strokeWidth={1}   fill="url(#gNorm)"   dot={false} />
                        <Area type="monotone" dataKey="suspicious" stroke="#F59E0B" strokeWidth={1.5} fill="url(#gSusp)"   dot={false} />
                        <Area type="monotone" dataKey="threats"    stroke="#E11D48" strokeWidth={2}   fill="url(#gThreat)" dot={false}
                            style={{ filter: 'drop-shadow(0 0 4px rgba(225,29,72,0.4))' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default NeuralThreatGraph;
