import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCcw, Zap, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Skeleton from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import { generateReport } from '../api';

const sev = (label) => {
    const l = label?.toUpperCase();
    if (l === 'THREAT' || l === 'CRITICAL') return { text: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' };
    if (l === 'SUSPICIOUS' || l === 'HIGH' || l === 'MEDIUM') return { text: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/10' };
    return { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' };
};

const ReportsPage = ({ incidents = [], logs = [], isLoading, onRefresh }) => {
    const [selectedReport, setSelectedReport] = useState(null);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const threatLog = logs.find(l => ['THREAT', 'CRITICAL', 'SUSPICIOUS'].includes(l.label?.toUpperCase())) || logs[0];
            if (!threatLog) return;
            const mlResult = {
                label: threatLog.label || 'Normal',
                severity_index: threatLog.label?.toUpperCase() === 'THREAT' ? 2 : 1,
                confidence: threatLog.confidence || 0.9,
                features: threatLog.features || {},
            };
            await generateReport(threatLog, mlResult);
            if (onRefresh) await onRefresh();
        } catch { /* silent */ }
        finally { setGenerating(false); }
    };

    const c = selectedReport ? sev(selectedReport.severity_label) : null;

    return (
        <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 flex flex-col">
            <PageHeader
                icon={FileText}
                iconColor="#2563EB"
                title="AI Forensics"
                subtitle="Automated Threat Investigation Reports"
                actions={<>
                    <button onClick={handleGenerate} disabled={generating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest disabled:opacity-40 transition-all"
                        style={{
                            background: generating ? 'rgba(255,255,255,0.05)' : '#fff',
                            color: generating ? 'rgba(255,255,255,0.5)' : '#000',
                            boxShadow: generating ? 'none' : '0 0 20px rgba(255,255,255,0.15)',
                        }}>
                        {generating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        {generating ? 'Compiling...' : 'Generate Report'}
                    </button>
                    <button onClick={onRefresh}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </>}
            />

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-[600px] pb-12">
                {/* Report list */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] font-mono">
                            {incidents.length} Artifact{incidents.length !== 1 ? 's' : ''} Compiled
                        </span>
                    </div>
                    <div className="space-y-2 max-h-[700px] overflow-y-auto hide-scrollbar">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                        ) : incidents.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-white/8 rounded-2xl">
                                <FileText className="w-10 h-10 mx-auto mb-3 text-white/10" />
                                <p className="text-[11px] font-mono text-white/20 uppercase tracking-widest">No artifacts</p>
                            </div>
                        ) : incidents.map((inc, i) => {
                            const s = sev(inc.severity_label);
                            const isActive = selectedReport?.report_id === inc.report_id;
                            return (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => setSelectedReport(inc)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${isActive
                                        ? 'bg-white border-transparent shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                        : 'bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.06]'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${isActive ? 'bg-black/10 border-black/15 text-black/60' : `${s.bg} ${s.border} ${s.text}`}`}>
                                            {inc.severity_label || 'UNKNOWN'}
                                        </span>
                                        <span className={`text-[9px] font-mono ${isActive ? 'text-black/30' : 'text-white/20'}`}>
                                            {inc.report_id?.slice(0, 8)}
                                        </span>
                                    </div>
                                    <h4 className={`text-sm font-bold tracking-tight truncate ${isActive ? 'text-black' : 'text-white'}`}>
                                        {inc.source_ip || inc.log_data?.ip_address || 'Unknown Vector'}
                                    </h4>
                                    <p className={`text-[10px] font-mono mt-0.5 truncate ${isActive ? 'text-black/50' : 'text-white/30'}`}>
                                        {inc.event_type || inc.log_data?.event_type || '—'}
                                    </p>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Report viewer */}
                <div className="col-span-12 xl:col-span-8 flex flex-col" style={{ minHeight: 600 }}>
                    <AnimatePresence mode="wait">
                        {selectedReport ? (
                            <motion.div key="open" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(10,10,12,0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(40px)' }}
                            >
                                {/* Report header */}
                                <div className="flex items-center justify-between px-7 py-5 border-b border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Forensic Report</h3>
                                            <p className="text-[10px] font-mono text-white/30 mt-0.5">{selectedReport.report_id}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.bg} ${c.border} ${c.text}`}>
                                        {selectedReport.severity_label}
                                    </span>
                                </div>

                                {/* Markdown content */}
                                <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
                                    <div className="prose prose-invert max-w-none
                                        prose-h1:font-plus-jakarta prose-h1:text-2xl prose-h1:font-black prose-h1:text-white prose-h1:border-b prose-h1:border-white/8 prose-h1:pb-4 prose-h1:mb-6
                                        prose-h2:font-plus-jakarta prose-h2:text-lg prose-h2:font-bold prose-h2:text-white/80 prose-h2:mt-8 prose-h2:mb-3
                                        prose-h3:text-sm prose-h3:font-black prose-h3:text-white/50 prose-h3:uppercase prose-h3:tracking-widest
                                        prose-p:text-white/50 prose-p:leading-relaxed prose-p:text-sm
                                        prose-li:text-white/50 prose-li:text-sm
                                        prose-strong:text-white prose-strong:font-bold
                                        prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
                                        prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/5 prose-blockquote:px-5 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:text-white/50">
                                        <ReactMarkdown>{selectedReport.report_markdown || selectedReport.markdown || '*No intelligence compiled.*'}</ReactMarkdown>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/8"
                                style={{ minHeight: 400 }}
                            >
                                <FileText className="w-16 h-16 text-white/5" />
                                <div className="text-center">
                                    <p className="text-sm font-bold text-white/15 tracking-widest uppercase">Select a Report</p>
                                    <p className="text-[10px] text-white/10 font-mono uppercase tracking-[0.2em] mt-1">Forensic viewer ready</p>
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
