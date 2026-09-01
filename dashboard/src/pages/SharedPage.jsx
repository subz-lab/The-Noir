import React from 'react';
import { Lock } from 'lucide-react';

const SharedPage = ({ title }) => {
    return (
        <div className="w-full h-[600px] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative group">
                <div className="absolute inset-0 rounded-full border border-blue-500/30 scale-150 animate-ping opacity-20" />
                <Lock className="w-8 h-8 text-white/40 group-hover:text-white/80 transition-colors" />
            </div>

            <h2 className="text-4xl font-bold text-white font-grotesk tracking-tight mb-4 text-center">
                {title}
            </h2>

            <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                <p className="text-[10px] text-blue-400 uppercase tracking-widest font-black">Module Locked / Pending Deployment</p>
            </div>

            <p className="mt-8 text-sm text-white/30 max-w-sm text-center leading-relaxed">
                This sector of the Noir architecture is currently restricted. Neural routing will be established in a future platform update.
            </p>
        </div>
    );
};

export default SharedPage;
