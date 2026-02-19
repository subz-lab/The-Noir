import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Lock, Terminal, Activity, ArrowRight, Github } from 'lucide-react';
import MagneticButton from './MagneticButton';
import CinematicHero from './CinematicHero';

const LandingPage = ({ onEnter }) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const featureY = useTransform(scrollYProgress, [0.1, 0.3], [100, 0]);
    const featureOpacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);

    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemFadeUp = {
        hidden: { opacity: 0, y: 30 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    return (
        <div ref={containerRef} className="relative bg-[#020203] selection:bg-white/10 overflow-x-hidden">
            {/* Cinematic Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,25,0)_0%,rgba(2,2,3,1)_100%)]" />

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 group"
                >
                    <div className="p-2 rounded-lg bg-white group-hover:glow-white transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <Shield className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xl font-bold font-grotesk tracking-tighter text-white uppercase italic">THE NOIR</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 md:gap-8 text-white/40"
                >
                    <a href="#" className="nav-link hidden md:block">ARCHIVE</a>
                    <a href="#" className="nav-link hidden md:block">NEURAL FLOW</a>
                    <MagneticButton
                        onClick={onEnter}
                        className="px-6 md:px-8 py-2 md:py-2.5 bg-white text-black rounded-full font-bold text-[10px] md:text-xs hover:scale-105 transition-all uppercase tracking-[0.2em] premium-shadow"
                    >
                        LAUNCH COMMAND
                    </MagneticButton>
                </motion.div>
            </nav>

            {/* Cinematic Autoplay Hero */}
            <CinematicHero onEnter={onEnter} />

            {/* Feature Section with Premium Glass and Motion */}
            <section className="relative z-10 px-6 md:px-8 py-16 md:py-24 bg-black/50">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-12"
                    >
                        {[
                            {
                                icon: Activity,
                                title: "Neural Detection",
                                desc: "RandomForest models trained on 2M+ telemetry events to catch zero-day patterns with silent precision."
                            },
                            {
                                icon: Terminal,
                                title: "AI Forensics",
                                desc: "Automated blast radius analysis using deep learning to reconstruct infiltration timelines in seconds."
                            },
                            {
                                icon: Lock,
                                title: "Hardened Core",
                                desc: "Enterprise-grade ELK orchestration containerized with Docker, ensuring immutable system integrity."
                            }
                        ].map((feat, i) => (
                            <motion.div
                                key={i}
                                variants={itemFadeUp}
                                className="glass-card group hover:translate-y-[-10px] transition-all duration-500"
                            >
                                <div className="p-4 rounded-2xl bg-white/5 w-fit mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
                                    <feat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-6 font-outfit tracking-tighter leading-tight">{feat.title}</h3>
                                <p className="text-white/40 leading-relaxed text-lg font-normal font-inter">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Big Text Callout with Reveal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="mt-20 md:mt-32 text-center px-4"
                    >
                        <h2 className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white/25 mb-12 md:mb-20 uppercase leading-[1.1] md:leading-none font-outfit">
                            "DEFENSE IS NOT<br className="hidden md:block" /> A REACTION, BUT<br className="hidden md:block" /> AN EVOLUTION."
                        </h2>

                        <div className="flex justify-center">
                            <MagneticButton
                                onClick={onEnter}
                                className="group px-16 py-8 bg-transparent border border-white/10 text-white rounded-[2rem] font-bold text-2xl hover:bg-white hover:text-black transition-all duration-700 flex items-center gap-6"
                            >
                                START MONITORING
                                <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform duration-500" />
                            </MagneticButton>
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="py-24 border-t border-white/5 text-center bg-black relative z-10">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="flex flex-col items-center gap-8"
                >
                    <div className="flex items-center gap-2 opacity-30 grayscale">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-black tracking-[0.3em]">THE NOIR</span>
                    </div>
                    <p className="text-white/20 text-xs font-bold tracking-widest uppercase">© 2026 The Noir Autonomous Intelligence. Built for hyper-scale defense.</p>
                </motion.div>
            </footer>
        </div>
    );
};

export default LandingPage;
