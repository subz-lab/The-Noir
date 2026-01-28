import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Dashboard from './Dashboard';
import CustomCursor from './components/CustomCursor';

const App = () => {
    const [view, setView] = useState('landing');

    const enterDashboard = () => {
        setView('dashboard');
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-[#020203] selection:bg-white/10 selection:text-white overflow-x-hidden">
            <CustomCursor />

            <AnimatePresence mode="wait">
                {view === 'landing' ? (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <LandingPage onEnter={enterDashboard} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="h-screen w-full overflow-hidden"
                    >
                        <Dashboard onExit={() => setView('landing')} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Interactive Elements */}
            <div className="fixed bottom-8 left-8 z-[100] flex items-center gap-4">
                <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020203] bg-white/[0.05] backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white/40">
                            ID
                        </div>
                    ))}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-white/20 uppercase">Network Integrity</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-500/80 uppercase">All Nodes Operational</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
