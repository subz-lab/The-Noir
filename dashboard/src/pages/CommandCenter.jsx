import React from 'react';
import SentinelParallaxHero from '../components/SentinelParallaxHero';
import SentinelGrid, { SentinelSection } from '../components/SentinelGrid';
import SystemHealth from '../components/SystemHealth';

const CommandCenter = () => {
    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <SentinelParallaxHero />

            <SentinelGrid className="mb-12">
                <SentinelSection id="health-grid" colSpan="col-span-12" title="Platform Power Density">
                    <div className="h-[400px]">
                        <SystemHealth />
                    </div>
                </SentinelSection>
            </SentinelGrid>
        </div>
    );
};

export default CommandCenter;
