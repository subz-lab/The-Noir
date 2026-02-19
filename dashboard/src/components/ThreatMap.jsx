import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── IP to Coordinate Helper ──────────────────────────────────────────────────
// In a real app, this would use a GeoIP library. For the demo, we hash the IP.
const getCoordsForIP = (ip) => {
    if (!ip) return { x: 50, y: 50 };
    const parts = ip.split('.').map(p => parseInt(p, 10));
    // Deterministic pseudo-random coordinates based on IP parts
    const x = (parts[0] * 3 + parts[2] * 2) % 100;
    const y = (parts[1] * 2 + parts[3] * 3) % 100;
    // Constrain to "land" areas roughly (skewing away from pure corners)
    return {
        x: 10 + (x * 0.8),
        y: 20 + (y * 0.6)
    };
};

const ThreatMap = ({ logs }) => {
    // Only show threats/suspicious on the map
    const activeBlips = useMemo(() => {
        return logs
            .filter(l => ['THREAT', 'CRITICAL', 'SUSPICIOUS', 'HIGH'].includes(l.label?.toUpperCase()))
            .slice(0, 15) // Limit blips for performance/clarity
            .map((l, i) => ({
                id: `${l.timestamp}-${l.ip_address}-${i}`,
                ...getCoordsForIP(l.ip_address),
                severity: l.label?.toUpperCase()
            }));
    }, [logs]);

    return (
        <div className="relative w-full aspect-[2/1] bg-black/20 rounded-3xl border border-white/5 overflow-hidden group">
            {/* World Map Background (Simplified Minimalist SVG) */}
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-10 grayscale invert brightness-200">
                <path
                    fill="currentColor"
                    d="M15,35 L18,34 L20,38 L25,40 L28,35 L35,32 L40,30 L45,35 L48,42 L42,50 L35,55 L30,60 L20,58 L15,50 Z"
                    className="text-white"
                /> {/* N. America */}
                <path
                    fill="currentColor"
                    d="M30,60 L35,75 L40,85 L45,80 L42,70 L38,65 Z"
                    className="text-white"
                /> {/* S. America */}
                <path
                    fill="currentColor"
                    d="M45,30 L55,25 L65,28 L70,35 L68,45 L60,50 L50,45 Z"
                    className="text-white"
                /> {/* Eurasia */}
                <path
                    fill="currentColor"
                    d="M50,45 L58,55 L60,65 L55,75 L48,68 L45,55 Z"
                    className="text-white"
                /> {/* Africa */}
                <path
                    fill="currentColor"
                    d="M75,65 L80,68 L85,75 L78,78 L72,72 Z"
                    className="text-white"
                /> {/* Australia */}

                {/* Lat/Long Grid Lines */}
                <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.1" strokeDasharray="1,2" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.1" strokeDasharray="1,2" />
            </svg>

            {/* Scanning Radar Overlay */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent w-1/2 h-full opacity-30 pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Active Blips */}
            <AnimatePresence>
                {activeBlips.map((blip) => (
                    <motion.div
                        key={blip.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        className="absolute w-2 h-2 -ml-1 -mt-1 pointer-events-none"
                        style={{ left: `${blip.x}%`, top: `${blip.y}%` }}
                    >
                        {/* Core Blip */}
                        <div className={`w-full h-full rounded-full ${blip.severity === 'THREAT' || blip.severity === 'CRITICAL'
                                ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                                : 'bg-orange-400 shadow-[0_0_10px_#fb923c]'
                            }`} />

                        {/* Ripple Effect */}
                        <motion.div
                            className={`absolute inset-0 rounded-full border ${blip.severity === 'THREAT' || blip.severity === 'CRITICAL'
                                    ? 'border-rose-500'
                                    : 'border-orange-400'
                                }`}
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 4, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Map UI Elements */}
            <div className="absolute bottom-4 left-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Incursion Stream</span>
                </div>
            </div>

            <div className="absolute top-4 right-6 text-right">
                <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Node Tracking: Global</p>
                <p className="text-[8px] font-mono text-emerald-500/40 uppercase tracking-tighter">Signal: Active</p>
            </div>
        </div>
    );
};

export default ThreatMap;
