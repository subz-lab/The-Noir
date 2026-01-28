import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className = "" }) => {
    return (
        <div className={`relative overflow-hidden bg-white/5 rounded-2xl ${className}`}>
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
            />
        </div>
    );
};

export default Skeleton;
