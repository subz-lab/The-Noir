import React from 'react';
import { motion } from 'framer-motion';

/**
 * SentinelGrid: Enterprise 12-Column Layout Engine
 * Optimized for Series-A startup density and Apple-level refinement.
 */
const SentinelGrid = ({ children, className = "" }) => {
    return (
        <div className={`grid grid-cols-12 gap-6 w-full ${className}`}>
            {children}
        </div>
    );
};

export const SentinelSection = ({
    id,
    children,
    colSpan = 'col-span-12',
    className = '',
    title
}) => {
    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className={`${colSpan} ${className} group`}
        >
            <div className="sentinel-card h-full flex flex-col">
                {title && (
                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-plus-jakarta">
                                {title}
                            </h3>
                        </div>
                        <div className="flex gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                        </div>
                    </div>
                )}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

export default SentinelGrid;
