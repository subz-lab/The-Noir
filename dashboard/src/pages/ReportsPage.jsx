import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCcw, PlusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import GlassCard from '../components/GlassCard';
import Skeleton from '../components/Skeleton';
import { generateReport } from '../api';

const getSeverityColor = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
};

const ReportsPage = ({ incidents, logs, isLoading, onRefresh }) => {
    const [selectedReport, setSelectedReport] = useState(null);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // Pick a threat from the latest logs to write a report on
            const threatLog = logs.find(l => ['THREAT', 'CRITICAL', 'SUSPICIOUS'].includes(l.label?.toUpperCase())) || logs[0];
            if (!threatLog) {
                alert("No logs available to generate a report off of.");
                return;
            }
            const mlResult = {
                label: threatLog.label || 'Normal',
                severity_index: threatLog.label?.toUpperCase() === 'THREAT' ? 2 : threatLog.label?.toUpperCase() === 'SUSPICIOUS' ? 1 : 0,
                confidence: threatLog.confidence || 0.9,
                features: threatLog.features || {},
            };
            await generateReport(threatLog, mlResult);
            if (onRefresh) await onRefresh();
        } catch (e) {
            console.error("Failed to generate report:", e);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white font-grotesk tracking-tight">AI Forensics</h2>
                        <p className="text-sm text-white/40">Automated Threat Investigation Reports</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-6 py-3 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-tight hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {generating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                        {generating ? 'Compiling Intel...' : 'Generate New Artifact'}
                    </button>
                    <button onClick={onRefresh} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/60">
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 flex-1 min-h-[600px] pb-12">
                {/* Sidebar Menu matching original design but better margins */}
                <div className="col-span-12 xl:col-span-4 flex flex-col space-y-4">
                    <div className="mb-2">
                        <h3 className="text-lg font-bold font-grotesk text-white">Artifact Stream</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Compiled Incident Logs</p>
                    </div>
                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 hide-scrollbar">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)
                        ) : incidents.length === 0 ? (
                            <div className="text-center py-12 text-white/20 border border-dashed border-white/10 rounded-3xl mt-4">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="text-sm font-bold tracking-widest uppercase">No Reports</p>
                            </div>
                        ) : incidents.map((inc, i) => (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={i}
                                onClick={() => setSelectedReport(inc)}
                                className={`w-full group p-6 rounded-3xl text-left transition-all border ${selectedReport?.report_id === inc.report_id
                                    ? 'bg-gradient-to-br from-white to-white/90 border-transparent shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border tracking-widest ${selectedReport?.report_id === inc.report_id
                                        ? 'bg-black/10 border-black/20 text-black'
                                        : getSeverityColor(inc.severity_label)
                                        }`}>
                                        {inc.severity_label || 'UNKNOWN'}
                                    </span>
                                    <span className={`text-[10px] font-mono ${selectedReport?.report_id === inc.report_id ? 'text-black/40' : 'text-white/20'}`}>
                                        {inc.report_id?.slice(0, 8)}
                                    </span>
                                </div>
                                <h4 className={`text-lg font-bold font-grotesk tracking-tight mb-1 ${selectedReport?.report_id === inc.report_id ? 'text-black' : 'text-white'}`}>
                                    {inc.source_ip || inc.log_data?.ip_address || 'Unknown Vector'}
                                </h4>
                                <p className={`text-xs ${selectedReport?.report_id === inc.report_id ? 'text-black/60' : 'text-white/40'}`}>
                                    {inc.event_type || inc.log_data?.event_type || 'Unknown Method'}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-8 flex flex-col h-[800px]">
                    <AnimatePresence mode="wait">
                        {selectedReport ? (
                            <motion.div
                                key="opened"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <GlassCard className="h-full !p-0 flex flex-col border-white/10 overflow-hidden shadow-2xl">
                                    <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                                <FileText className="w-7 h-7 text-black" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold font-grotesk text-white tracking-tight">Threat Analysis Report</h3>
                                                <p className="text-xs text-white/30 font-mono mt-1">{selectedReport.report_id}</p>
                                            </div>
                                        </div>
                                        <span className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase border ${getSeverityColor(selectedReport.severity_label)}`}>
                                            {selectedReport.severity_label}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-12 bg-[#020204]/80 backdrop-blur-xl selection:bg-white selection:text-black hide-scrollbar">
                                        <div className="prose prose-invert max-w-none
                                            prose-h1:font-grotesk prose-h1:text-4xl prose-h1:font-bold prose-h1:text-white prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-6 prose-h1:mb-8
                                            prose-h2:font-grotesk prose-h2:text-2xl prose-h2:text-white/90 prose-h2:mt-12 prose-h2:mb-4
                                            prose-h3:font-grotesk prose-h3:text-lg prose-h3:text-white/70 prose-h3:uppercase prose-h3:tracking-widest
                                            prose-p:text-white/60 prose-p:leading-relaxed prose-p:text-[15px]
                                            prose-li:text-white/60 prose-strong:text-white prose-strong:font-bold prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                                            prose-a:text-blue-400 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-xl">
                                            <ReactMarkdown>{selectedReport.report_markdown || selectedReport.markdown || '*No intelligence compiled for this artifact.*'}</ReactMarkdown>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full glass-card border-dashed border-white/10 flex flex-col items-center justify-center space-y-8 rounded-[2.5rem] border bg-white/[0.01]"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white/10 blur-[100px] rounded-full animate-pulse" />
                                    <FileText className="w-24 h-24 text-white/5 relative z-10" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-2xl font-bold text-white/20 font-grotesk tracking-tighter">SELECT ARTIFACT</h4>
                                    <p className="text-sm text-white/10 tracking-[0.2em] font-black uppercase mt-2">Awaiting Forensic Access</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
