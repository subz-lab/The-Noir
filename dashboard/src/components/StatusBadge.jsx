import React from 'react';

/**
 * Universal StatusBadge for incidents and alerts.
 */
const StatusBadge = ({ type = 'info', children }) => {
    const variants = {
        critical: 'badge-critical',
        high: 'badge-high',
        medium: 'badge-medium',
        low: 'badge-low',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };

    return (
        <span className={`badge ${variants[type.toLowerCase()] || variants.info}`}>
            {children}
        </span>
    );
};

export default StatusBadge;
