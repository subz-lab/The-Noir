import React from 'react';
import { motion } from 'framer-motion';

/**
 * SIH-level page header — used by all dashboard pages for consistency.
 * Replaces all ad-hoc "flex items-center gap-4 mb-8" headers.
 */
const PageHeader = ({ icon: Icon, iconColor = '#2563EB', iconBg, title, subtitle, actions }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between mb-8"
        >
            <div className="flex items-center gap-4">
                {Icon && (
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: iconBg || `${iconColor}12`,
                            border: `1px solid ${iconColor}30`,
                            boxShadow: `0 0 20px ${iconColor}15`,
                        }}
                    >
                        <Icon className="w-5 h-5" style={{ color: iconColor }} />
                    </div>
                )}
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none font-plus-jakarta">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-[11px] text-white/30 mt-1.5 font-mono uppercase tracking-[0.15em]">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </motion.div>
    );
};

export default PageHeader;
