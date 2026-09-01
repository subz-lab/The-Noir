import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Command, Sparkles, X } from 'lucide-react';

const AICommandConsole = () => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState([
        { type: 'system', content: 'Neural Command Interface Initialized. Awaiting query...' }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!command.trim()) return;

        setHistory(prev => [...prev, { type: 'user', content: command }]);

        // Mock AI Response
        setTimeout(() => {
            const response = command.toLowerCase().includes('critical')
                ? 'Crit-Scan: Isolated 3 anomalies in Sector 7G. Mitigation playbooks primed.'
                : 'Query processed. No active breaches detected in current vector.';
            setHistory(prev => [...prev, { type: 'ai', content: response }]);
        }, 600);

        setCommand('');
    };

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-deep rounded-[2.5rem] p-8 holographic-glow border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex flex-col h-[400px]"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight uppercase">AI Command Console</h3>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Neural Processor v4.0</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-2 mb-6 hide-scrollbar font-mono text-[11px]">
                <AnimatePresence mode="popLayout">
                    {history.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className={`flex gap-3 ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl border ${item.type === 'user'
                                    ? 'bg-white/5 border-white/10 text-white/60'
                                    : item.type === 'system'
                                        ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400/80 italic'
                                        : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                                }`}>
                                {item.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Command className="w-3.5 h-3.5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Express command in natural language..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-[11px] text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 focus:bg-white/[0.08] transition-all"
                />
                <button
                    type="submit"
                    className="absolute inset-y-0 right-3 flex items-center pr-2"
                >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-all hover:scale-105 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <Send className="w-3.5 h-3.5 text-white/40 group-hover:text-black" />
                    </div>
                </button>
            </form>

            <div className="mt-4 flex items-center gap-2 px-2">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-black">AI suggestion: Run "Sector 7 Asset Validation"</span>
            </div>
        </motion.div>
    );
};

export default AICommandConsole;
