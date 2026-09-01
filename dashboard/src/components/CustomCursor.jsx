import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const springConfig = { damping: 25, stiffness: 200 };
    const cursorX = useSpring(0, springConfig);
    const cursorY = useSpring(0, springConfig);

    useEffect(() => {
        const moveMouse = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            cursorX.set(e.clientX - 16);
            cursorY.set(e.clientY - 16);
        };

        // Use event delegation on document to avoid per-element listener leaks
        const handleOverDocument = (e) => {
            if (e.target.closest('button, a, input, [role="button"]')) {
                setIsHovering(true);
            }
        };
        const handleOutDocument = (e) => {
            if (e.target.closest('button, a, input, [role="button"]')) {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveMouse);
        document.addEventListener('mouseover', handleOverDocument);
        document.addEventListener('mouseout', handleOutDocument);

        return () => {
            window.removeEventListener('mousemove', moveMouse);
            document.removeEventListener('mouseover', handleOverDocument);
            document.removeEventListener('mouseout', handleOutDocument);
        };
    }, [cursorX, cursorY]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block">
            {/* Main Dot */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full bg-white transition-opacity duration-300 pointer-events-none"
                style={{
                    x: cursorX,
                    y: cursorY,
                    opacity: isHovering ? 0.3 : 0.1,
                    scale: isHovering ? 1.5 : 1,
                    mixBlendMode: 'difference'
                }}
            />

            {/* Center Core */}
            <motion.div
                className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-white pointer-events-none"
                style={{
                    x: mousePosition.x - 3,
                    y: mousePosition.y - 3,
                    opacity: 0.8
                }}
            />

            {/* Trailing Glow */}
            <motion.div
                className="fixed top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"
                style={{
                    x: mousePosition.x - 64,
                    y: mousePosition.y - 64,
                }}
            />
        </div>
    );
};

export default CustomCursor;
