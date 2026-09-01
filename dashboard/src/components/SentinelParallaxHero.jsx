import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
    Activity,
    ShieldCheck,
    Zap,
    Target,
    TrendingUp,
    ShieldAlert
} from 'lucide-react';

/**
 * SentinelParallaxHero: The high-impact cinematic centerpiece.
 * Features: 
 * 1. Multi-layer depth movement (Parallax)
 * 2. Mouse-based spatial tilt
 * 3. High-level metric glass overlays
 */
const SentinelParallaxHero = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { scrollY } = useScroll();

    // Mouse movement listeners
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 40,
                y: (e.clientY / window.innerHeight - 0.5) * 40
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Spring physics for butter-smooth motion
    const springConfig = { damping: 30, stiffness: 200, mass: 1 };
    const mouseX = useSpring(mousePos.x, springConfig);
    const mouseY = useSpring(mousePos.y, springConfig);

    // Scroll transformations
    const scrollYProgress = useTransform(scrollY, [0, 500], [0, -150]);
    const scrollScale = useTransform(scrollY, [0, 500], [1, 1.1]);

    return (
        <section className="relative w-full h-[600px] rounded-[2.5rem] overflow-hidden bg-[#050508] border border-white/5 group mb-12">
            {/* Cinematic Background Visualization Layers */}
            <div className="absolute inset-0 z-0">
                {/* Layer 1: Deep Atmosphere (Background) */}
                <motion.div
                    style={{
                        x: useTransform(mouseX, x => x * -0.2),
                        y: useTransform(mouseY, y => y * -0.2),
                        scale: scrollScale
                    }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.15),transparent_70%)] opacity-60"
                />

                {/* Layer 2: Neural Grid (Mid-layer) */}
                <motion.div
                    style={{
                        x: useTransform(mouseX, x => x * -0.5),
                        y: useTransform(mouseY, y => y * -0.5 + (scrollY.get() * 0.3)),
                    }}
                    className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40"
                />

                {/* Layer 3: Dynamic Glow Vectors (Foreground) */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full"
                    />
                    <motion.div
                        animate={{ opacity: [0.05, 0.2, 0.05], scale: [1.2, 1, 1.2] }}
                        transition={{ duration: 12, repeat: Infinity }}
                        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full"
                    />
                </div>

                {/* Layer 4: Floating Tech Nodes (Cinematic Sharpness) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                </div>
            </div>

            {/* Central Information Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-6">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Efficiency up 24% this month</span>
                    </div>
                    <h2 className="text-6xl font-black text-white tracking-tighter mb-4 font-plus-jakarta leading-none">
                        Autonomous <span className="text-blue-500">Security</span>
                    </h2>
                    <p className="text-white/40 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                        Detecting, investigating, and responding to cyber threats across the global enterprise.
                    </p>
                </motion.div>
            </div>

            {/* Floating SOC Metrics Cards (Investor Tier) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Metric 1: Active Detections */}
                <motion.div
                    style={{
                        x: useTransform(mouseX, x => x * 1.2),
                        y: useTransform(mouseY, y => y * 1.2),
                    }}
                    className="absolute top-20 left-20 w-64 p-6 glass-premium rounded-3xl border border-white/10 shadow-2xl animate-sentinel-float pointer-events-auto"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <ShieldAlert className="w-5 h-5 text-orange-500" />
                        </div>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Live Flow</span>
                    </div>
                    <p className="text-xs font-bold text-white/40 mb-1 uppercase tracking-tight">Active Threats</p>
                    <p className="text-3xl font-black text-white font-plus-jakarta">1,240</p>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "65%" }}
                            className="h-full bg-orange-500 shadow-[0_0_10px_#f97316]"
                        />
                    </div>
                </motion.div>

                {/* Metric 2: Automation Success */}
                <motion.div
                    style={{
                        x: useTransform(mouseX, x => x * 0.8),
                        y: useTransform(mouseY, y => y * 0.8),
                    }}
                    className="absolute bottom-20 right-20 w-72 p-6 glass-premium rounded-3xl border border-white/10 shadow-2xl pointer-events-auto delay-75 animate-sentinel-float"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase">Optimal</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-white/40 mb-1 uppercase tracking-tight">Automation Success</p>
                    <div className="flex items-end gap-3">
                        <p className="text-3xl font-black text-white font-plus-jakarta">99.8%</p>
                        <p className="text-[10px] font-bold text-emerald-400 mb-1.5">+2.4%</p>
                    </div>
                    <div className="flex gap-1 mt-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`h-6 flex-1 rounded-sm ${i < 6 ? 'bg-blue-500/40' : 'bg-blue-500 shadow-[0_0_15px_#3b82f6]'}`} />
                        ))}
                    </div>
                </motion.div>

                {/* Metric 3: Response Time */}
                <motion.div
                    style={{
                        x: useTransform(mouseX, x => x * -1.5),
                        y: useTransform(mouseY, y => y * -1.5),
                    }}
                    className="absolute bottom-40 left-1/2 -translate-x-1/2 w-56 p-4 glass-premium rounded-2xl border border-blue-500/20 shadow-2xl pointer-events-auto"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Mean Response</p>
                            <p className="text-lg font-black text-white font-plus-jakarta leading-none">0.82 <span className="text-[11px] font-bold text-white/40">ms</span></p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Visionary Footer Stats */}
            <div className="absolute bottom-0 left-0 right-0 h-24 px-12 border-t border-white/5 bg-gradient-to-t from-black to-transparent flex items-center justify-between z-30">
                <div className="flex gap-12">
                    <HeroStat label="Active Scans" val="144k" />
                    <HeroStat label="Blocked Attacks" val="2.4M" />
                    <HeroStat label="System Integrity" val="99.9%" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020204] bg-white/10" />
                        ))}
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Analyst Nodes Online</p>
                </div>
            </div>
        </section>
    );
};

const HeroStat = ({ label, val }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</span>
        <span className="text-xl font-black text-white font-plus-jakarta">{val}</span>
    </div>
);

export default SentinelParallaxHero;
