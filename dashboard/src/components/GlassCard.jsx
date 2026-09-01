import React from 'react';
import { motion } from 'framer-motion';

/**
 * Modular GlassCard component for SaaS platforms.
 * Supports title, actions, and custom depth.
 */
const GlassCard = ({
    children,
    title,
    subtitle,
    actions,
    className = "",
    depth = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`saas-card flex flex-col ${className}`}
            style={{
                transform: `translateZ(${depth}px)`,
                transition: 'transform 0.4s var(--ease-out-expo)'
            }}
        >
            {(title || actions) && (
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div>
                        {title && (
                            <h3 className="text-sm font-bold text-white tracking-tight leading-none uppercase font-outfit">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-[10px] text-white/30 font-black mt-1.5 uppercase tracking-widest italic">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </motion.div>
    );
};

export default GlassCard;
