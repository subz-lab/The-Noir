import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import MagneticButton from './MagneticButton';

const CinematicHero = ({ onEnter }) => {
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);

    const frameCount = 192;

    // Preload images
    useEffect(() => {
        const preloadImages = async () => {
            const loadedImages = [];
            let loadedCount = 0;

            for (let i = 0; i < frameCount; i++) {
                const img = new Image();
                img.src = `/parallax/frame_${i.toString().padStart(3, '0')}.webp`;

                await new Promise((resolve) => {
                    img.onload = () => {
                        loadedCount++;
                        setProgress(Math.round((loadedCount / frameCount) * 100));
                        resolve();
                    };
                    img.onerror = resolve; // Skip failed images
                });
                loadedImages.push(img);
            }

            setImages(loadedImages);
            setIsLoaded(true);
        };

        preloadImages();
    }, []);

    // Autoplay Loop Logic
    useEffect(() => {
        if (!isLoaded || images.length === 0) return;

        let frameId;
        const speed = 0.2; // Adjust speed (smaller = slower)
        let frameIndex = 0;

        const animate = () => {
            frameIndex = (frameIndex + speed) % frameCount;
            setCurrentFrame(Math.floor(frameIndex));
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frameId);
    }, [isLoaded, images.length]);

    // Render loop
    useEffect(() => {
        if (!isLoaded || images.length === 0) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const render = (index) => {
            const img = images[index];
            if (img) {
                const canvasAspect = canvas.width / canvas.height;
                const imgAspect = img.width / img.height;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (canvasAspect > imgAspect) {
                    drawWidth = canvas.width;
                    drawHeight = canvas.width / imgAspect;
                    offsetX = 0;
                    offsetY = (canvas.height - drawHeight) / 2;
                } else {
                    drawHeight = canvas.height;
                    drawWidth = canvas.height * imgAspect;
                    offsetX = (canvas.width - drawWidth) / 2;
                    offsetY = 0;
                }

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
        };

        render(currentFrame);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            render(currentFrame);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [isLoaded, images, currentFrame]);

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden">
            {!isLoaded && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black gap-4">
                    <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white"
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">
                        Initializing Neural Stream {progress}%
                    </span>
                </div>
            )}

            <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
            />

            {/* Centered Overlay Content */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="container mx-auto h-full px-8 flex flex-col justify-center items-center text-center">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.15, delayChildren: 0.8 }
                            }
                        }}
                        className="max-w-4xl pointer-events-auto flex flex-col items-center"
                    >
                        <motion.h1
                            variants={{
                                hidden: { opacity: 0, scale: 0.9, filter: "blur(20px)" },
                                show: { opacity: 1, scale: 1, filter: "blur(0px)" }
                            }}
                            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                            className="text-5xl md:text-7xl lg:text-[8rem] font-extrabold tracking-tighter leading-[0.85] mb-12 uppercase premium-gradient-text font-outfit"
                        >
                            AUTONOMOUS<br />DEFENSE
                        </motion.h1>

                        <motion.p
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 }
                            }}
                            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                            className="text-xl md:text-2xl text-white/50 font-normal leading-relaxed mb-16 max-w-2xl font-inter italic"
                        >
                            The next evolution of security operations. Powered by silent intelligence, driven by autonomous neural networks.
                        </motion.p>

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 }
                            }}
                            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                        >
                            <MagneticButton
                                onClick={onEnter}
                                className="px-12 py-6 bg-white text-black rounded-full font-bold text-xl hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all uppercase tracking-[0.2em] flex items-center gap-4 w-fit"
                            >
                                Launch Center
                                <ArrowRight className="w-6 h-6" />
                            </MagneticButton>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Cinematic Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
        </div>
    );
};

export default CinematicHero;
