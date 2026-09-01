import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Zap, Lock, Terminal, Activity, Eye, ArrowRight } from 'lucide-react';
import MagneticButton from './MagneticButton';
import CinematicHero from './CinematicHero';

/**
 * The Noir — VisionOS Spatial Landing Page
 * Apple VisionOS-inspired floating spatial interface with the original cinematic hero.
 */

// ── VisionOS Glass Panel ──
const GlassPanel = ({ children, className = '', delay = 0, hover = true }) => (
    <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
        whileHover={hover ? { y: -8, scale: 1.02, transition: { duration: 0.5 } } : {}}
        className={`
            relative overflow-hidden rounded-[2rem]
            bg-white/[0.04] backdrop-blur-[60px]
            border border-white/[0.08]
            shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
            transition-shadow duration-700
            hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
            ${className}
        `}
    >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {children}
    </motion.div>
);

// ── Spatial Scroll Section ──
const SpatialSection = ({ children, className = '', id }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });
    const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <motion.section ref={ref} id={id} style={{ y, opacity }} className={`relative ${className}`}>
            {children}
        </motion.section>
    );
};


const LandingPage = ({ onEnter }) => {
    return (
        <div className="relative bg-[#030305] selection:bg-white/10 overflow-x-hidden">

            {/* ═══════ AMBIENT ATMOSPHERE ═══════ */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(37,99,235,0.06)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.03)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,3,5,1)_100%)]" />
            </div>


            {/* ═══════ FLOATING GLASS NAVIGATION ═══════ */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[900px]"
            >
                <div className="
                    flex items-center justify-between px-6 py-3
                    rounded-[1.25rem]
                    bg-white/[0.04] backdrop-blur-[60px]
                    border border-white/[0.08]
                    shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]
                ">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                            <Shield className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight font-plus-jakarta uppercase italic">THE NOIR</span>
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        {['Platform', 'Technology', 'Security', 'Contact'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`}
                                className="px-4 py-2 text-[11px] font-semibold text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-300 uppercase tracking-[0.15em]"
                            >
                                {item}
                            </a>
                        ))}
                    </div>

                    <button
                        onClick={onEnter}
                        className="px-5 py-2 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-500 hover:scale-105"
                    >
                        Launch Platform
                    </button>
                </div>
            </motion.nav>


            {/* ═══════ ORIGINAL CINEMATIC HERO (UNTOUCHED) ═══════ */}
            <CinematicHero onEnter={onEnter} />


            {/* ═══════ FLOATING PRODUCT PANELS ═══════ */}
            <SpatialSection id="platform" className="py-16 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400/60 mb-4">Core Capabilities</p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] text-white font-outfit leading-tight">
                            Intelligent Defense<br />
                            <span className="text-white/20">at Every Layer</span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Eye,
                                title: 'Threat Detection',
                                desc: 'Neural pattern recognition trained on 2M+ telemetry events. Catches zero-day exploits before they propagate.',
                                stat: '< 0.3s',
                                statLabel: 'Detection Latency',
                                color: 'text-rose-400',
                                bg: 'from-rose-500/10'
                            },
                            {
                                icon: Zap,
                                title: 'Automation Engine',
                                desc: 'Autonomous response playbooks that neutralize threats without human intervention. Self-healing infrastructure.',
                                stat: '1,400+',
                                statLabel: 'Daily Decisions',
                                color: 'text-emerald-400',
                                bg: 'from-emerald-500/10'
                            },
                            {
                                icon: Terminal,
                                title: 'Incident Management',
                                desc: 'AI-driven blast radius analysis with automated forensic timeline reconstruction in seconds.',
                                stat: '99.8%',
                                statLabel: 'Resolution Rate',
                                color: 'text-blue-400',
                                bg: 'from-blue-500/10'
                            },
                            {
                                icon: Activity,
                                title: 'Real-Time Monitoring',
                                desc: 'Global sensor mesh with sub-second telemetry ingestion across 14 enterprise nodes worldwide.',
                                stat: '14',
                                statLabel: 'Active Nodes',
                                color: 'text-orange-400',
                                bg: 'from-orange-500/10'
                            }
                        ].map((panel, i) => (
                            <GlassPanel key={i} delay={i * 0.1} className="p-10">
                                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${panel.bg} to-transparent opacity-60 rounded-t-[2rem]`} />
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`p-3 rounded-2xl bg-white/[0.06] ${panel.color}`}>
                                            <panel.icon className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-white font-outfit">{panel.stat}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">{panel.statLabel}</p>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight font-outfit">{panel.title}</h3>
                                    <p className="text-white/35 text-sm leading-relaxed font-inter">{panel.desc}</p>
                                </div>
                            </GlassPanel>
                        ))}
                    </div>
                </div>
            </SpatialSection>


            {/* ═══════ FLOATING VISUALIZATION ═══════ */}
            <SpatialSection id="technology" className="py-16 px-6 md:px-12">
                <div className="max-w-5xl mx-auto">
                    <GlassPanel hover={false} className="p-10 md:p-12">
                        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-blue-500/[0.04] to-transparent pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400/80">Neural Grid Active</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white mb-6 font-outfit leading-tight">
                                Global Threat<br />Intelligence Mesh
                            </h2>
                            <p className="text-white/30 text-base max-w-lg mb-10 font-inter leading-relaxed">
                                A self-organizing neural network that maps, tracks, and neutralizes threats across your entire infrastructure in real-time.
                            </p>

                            {/* Visualization: Abstract Network */}
                            <div className="relative w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden bg-black/30 border border-white/[0.04]">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {[1, 2, 3, 4].map((ring) => (
                                        <motion.div
                                            key={ring}
                                            animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
                                            transition={{ duration: 30 + ring * 10, repeat: Infinity, ease: "linear" }}
                                            className="absolute rounded-full border border-white/[0.04]"
                                            style={{ width: `${ring * 22}%`, height: `${ring * 22}%` }}
                                        />
                                    ))}
                                    <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] z-10" />
                                </div>

                                {[
                                    { x: '20%', y: '30%', color: 'bg-rose-500' },
                                    { x: '75%', y: '25%', color: 'bg-emerald-500' },
                                    { x: '30%', y: '70%', color: 'bg-orange-400' },
                                    { x: '80%', y: '65%', color: 'bg-blue-400' },
                                    { x: '50%', y: '15%', color: 'bg-emerald-500' },
                                ].map((node, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                                        className={`absolute w-2 h-2 rounded-full ${node.color} shadow-lg`}
                                        style={{ left: node.x, top: node.y }}
                                    />
                                ))}

                                <div className="absolute inset-0 opacity-[0.02]"
                                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-8 mt-12 w-full max-w-md">
                                {[
                                    { label: 'Nodes', value: '14' },
                                    { label: 'Uptime', value: '99.97%' },
                                    { label: 'Latency', value: '< 1ms' },
                                ].map((s, i) => (
                                    <div key={i} className="text-center">
                                        <p className="text-xl font-bold text-white font-outfit">{s.value}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassPanel>
                </div>
            </SpatialSection>


            {/* ═══════ DEPTH CALLOUT + CTA ═══════ */}
            <SpatialSection id="security" className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="text-4xl md:text-7xl font-bold tracking-[-0.04em] text-white/15 mb-16 uppercase leading-[1.05] font-outfit"
                    >
                        "DEFENSE IS NOT<br />A REACTION, BUT<br />AN EVOLUTION."
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                    >
                        <GlassPanel hover={false} className="inline-block">
                            <MagneticButton
                                onClick={onEnter}
                                className="px-16 py-8 text-white text-lg font-bold uppercase tracking-[0.15em] flex items-center gap-5 group"
                            >
                                Start Monitoring
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
                            </MagneticButton>
                        </GlassPanel>
                    </motion.div>
                </div>
            </SpatialSection>


            {/* ═══════ FOOTER ═══════ */}
            <footer className="relative py-12 border-t border-white/[0.04]">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="flex items-center gap-2.5 opacity-30">
                            <Shield className="w-4 h-4 text-white" />
                            <span className="text-xs font-bold tracking-[0.3em] uppercase">THE NOIR</span>
                        </div>
                        <p className="text-white/15 text-[10px] font-semibold tracking-[0.2em] uppercase">
                            © 2026 The Noir Autonomous Intelligence. Spatial defense for the modern enterprise.
                        </p>
                    </motion.div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
