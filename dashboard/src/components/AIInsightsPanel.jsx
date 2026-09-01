import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, ShieldCheck, AlertCircle, TrendingUp, Terminal, Globe } from 'lucide-react';
import TiltContainer from './3DTiltContainer';
import { fetchInsights } from '../api';

const AIInsightsPanel = () => {
    const [insights, setInsights] = useState([]);
    const [modelInfo, setModelInfo] = useState({ model_type: 'RandomForest', total_analyzed: 0 });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchInsights();
                setModelInfo({ model_type: data.model_type, total_analyzed: data.total_analyzed, avg_confidence: data.avg_confidence });

                const iconMap = {
                    stat: { icon: ShieldCheck, color: 'text-emerald-400' },
                    alert: { icon: AlertCircle, color: 'text-rose-400' },
                    info: { icon: Zap, color: 'text-blue-400' },
                    trend: { icon: TrendingUp, color: 'text-orange-400' },
                    intel: { icon: Globe, color: 'text-purple-400' },
                };

                const mapped = (data.insights || []).map(insight => {
                    const mapping = iconMap[insight.type] || iconMap.info;
                    return {
                        icon: mapping.icon,
                        color: mapping.color,
                        msg: `${insight.title}: ${insight.value}`,
                        detail: insight.description,
                    };
                });
                setInsights(mapped);
            } catch (e) {
                console.error('Insights fetch failed:', e);
            }
        };
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    const displayInsights = insights.length > 0 ? insights : [
        { icon: Sparkles, color: 'text-white/30', msg: 'Awaiting data...', detail: 'Ingest logs to see AI insights.' }
    ];

    return (
        <TiltContainer className="h-full">
            <div className="h-full glass-premium rounded-[2.5rem] p-8 flex flex-col glow-edge-emerald">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-xl bg-emerald-500/20">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white font-grotesk tracking-tight">AI Insights</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Cognitive Threat Analysis</p>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    {displayInsights.map((insight, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                        >
                            <div className="flex gap-4">
                                <insight.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${insight.color}`} />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white/90 leading-relaxed">{insight.msg}</p>
                                    {insight.detail && (
                                        <p className="text-[10px] text-white/30 leading-relaxed">{insight.detail}</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                {modelInfo.model_type} · {modelInfo.total_analyzed} analyzed
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        </div>
                    </div>
                </div>
            </div>
        </TiltContainer>
    );
};

export default AIInsightsPanel;
