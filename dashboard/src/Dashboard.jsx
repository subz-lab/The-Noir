// The Noir — SOC Automation Platform v2.0 (Stable)
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

// Component Imports (The Noir Architecture)
import SentinelTopNav from './components/SentinelTopNav';
import LayeredSidebar from './components/LayeredSidebar';
import { fetchLogs, fetchReports, subscribeToLogs } from './api';

// Pages
import CommandCenter from './pages/CommandCenter';
import IncidentsPage from './pages/IncidentsPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
import SOARPage from './pages/SOARPage';
import AttackSimulatorPage from './pages/AttackSimulatorPage';
import LogsPage from './pages/LogsPage';
import ReportsPage from './pages/ReportsPage';
import SharedPage from './pages/SharedPage';

/**
 * The Noir: Command Center
 * A production-ready SOC automation platform with cinematic parallax visuals.
 */
const Dashboard = ({ onExit }) => {
    // 🔷 Demo-Ready State Management
    const [logs, setLogs] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('dashboard');

    // 🔷 Intelligent Data Pipeline
    const loadDemoData = useCallback(async () => {
        try {
            // Defensive check for API availability
            if (typeof fetchLogs !== 'function' || typeof fetchReports !== 'function') {
                console.error("Critical API Error: fetch functions missing.");
                setIsLoading(false);
                return;
            }

            const [logsRes, reportsRes] = await Promise.allSettled([
                fetchLogs(30),
                fetchReports()
            ]);

            if (logsRes.status === 'fulfilled') setLogs(logsRes.value?.logs || []);

            if (reportsRes.status === 'fulfilled') {
                const rawData = reportsRes.value || [];
                const realIncidents = (Array.isArray(rawData) ? rawData : []).map((inc, i) => ({
                    ...inc,
                    id: inc.report_id || `IR-${1000 + i}`,
                    type: inc.event_type ? inc.event_type.replace(/_/g, ' ').toUpperCase() : (inc.type || 'SECURITY INCIDENT'),
                    status: inc.severity_label === 'CRITICAL' ? 'High Alert' : inc.severity_label === 'HIGH' ? 'Investigating' : 'Mitigated'
                }));
                setIncidents(realIncidents);
            }
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        } finally {
            // Slight delay to ensure fluid entry animation
            setTimeout(() => setIsLoading(false), 800);
        }
    }, []);

    useEffect(() => {
        loadDemoData();

        let ws;
        try {
            ws = subscribeToLogs((msg) => {
                if (msg.type === 'NEW_LOG') setLogs(prev => [msg.log, ...prev].slice(0, 40));
                else if (msg.type === 'BULK_LOGS') loadDemoData();
            });
        } catch (e) {
            console.warn("WS Subscription failed:", e);
        }

        return () => ws?.close?.();
    }, [loadDemoData]);

    return (
        <div className="flex min-h-screen bg-[#020204] text-[#F8F9FA] overflow-hidden selection:bg-blue-500/30 font-plus-jakarta">
            {/* Global Identity Layer */}
            <SentinelTopNav
                incidentCount={incidents.length}
                alertCount={logs.filter(l => ['THREAT','CRITICAL'].includes((l.label||'').toUpperCase())).length}
            />
            <LayeredSidebar active={activeModule} onChange={setActiveModule} incidentCount={incidents.length} />

            <div className="flex-1 flex flex-col min-w-0 h-screen pt-20">
                {/* 🔷 Loading HUD (Cinematic Reveal) */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            exit={{ opacity: 0, filter: "blur(20px)" }}
                            className="fixed inset-0 z-[300] bg-[#020203] flex flex-col items-center justify-center gap-6"
                        >
                            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Initializing Core</span>
                                <h2 className="text-xl font-bold text-white uppercase italic">THE NOIR</h2>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* 🔷 Main Layout Engine (Investor Flow) */}
                <main className="flex-1 overflow-y-auto p-8 pl-80 pr-12 scroll-smooth hide-scrollbar relative">
                    <div className="max-w-[1600px] mx-auto pb-24 relative z-10">
                        {activeModule === 'dashboard' && <CommandCenter incidents={incidents} logs={logs} />}
                        {activeModule === 'incidents' && <IncidentsPage incidents={incidents} logs={logs} isLoading={isLoading} onRefresh={loadDemoData} />}
                        {activeModule === 'threat-intel' && <ThreatIntelPage logs={logs} />}
                        {activeModule === 'soar' && <SOARPage />}
                        {activeModule === 'simulate' && <AttackSimulatorPage />}
                        {activeModule === 'logs' && <LogsPage logs={logs} isLoading={isLoading} onRefresh={loadDemoData} />}
                        {activeModule === 'reports' && <ReportsPage incidents={incidents} logs={logs} isLoading={isLoading} onRefresh={loadDemoData} />}
                        {['settings'].includes(activeModule) && (
                            <SharedPage title={activeModule.charAt(0).toUpperCase() + activeModule.slice(1).replace('-', ' ')} />
                        )}

                        {/* Demo Status Footer */}
                        <footer className="mt-20 pt-12 border-t border-white/5 flex justify-between items-center text-[9px] font-mono tracking-[0.4em] text-white/20 uppercase">
                            <div className="flex gap-16">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                                    <span className="text-white/40 font-black">The Noir Defense OS v2.0</span>
                                </div>
                                <span>GRID_ID: US_EAST_01</span>
                            </div>
                            <div className="flex gap-4 items-center">
                                <span className="text-white/5 font-black text-[7px] tracking-widest">AUTONOMOUS DEFENSE ACTIVE</span>
                                <div className="w-40 h-[1px] bg-white/5" />
                                <span>© 2026 The Noir • Autonomous Intelligence</span>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>

            {/* Cinematic Overlay: Neural AI Trigger */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="fixed bottom-12 right-12 w-16 h-16 rounded-[1.25rem] bg-blue-600 flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4)] cursor-pointer group z-[200]"
            >
                <div className="relative">
                    <Zap className="w-7 h-7 text-white" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-lg border-4 border-[#020204]" />
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
