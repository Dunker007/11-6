import React from 'react';
import { motion } from 'framer-motion';

export const Canvas: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-bg-main to-bg-main">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center max-w-2xl"
                >
                    <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                        What do you want to build?
                    </h2>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <input
                            type="text"
                            placeholder="Describe your idea... (e.g., 'A crypto trading bot that tracks whale wallets')"
                            className="relative w-full bg-black/80 border border-white/10 text-white text-lg px-6 py-4 rounded-xl focus:outline-none focus:border-neon-blue/50 placeholder-gray-600 shadow-2xl backdrop-blur-xl"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-xs font-mono text-neon-blue border border-neon-blue/20">
                                GENERATE
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 grid grid-cols-3 gap-4">
                        <QuickAction title="New Idea" desc="Start from scratch" delay={0.1} />
                        <QuickAction title="Import" desc="Analyze existing repo" delay={0.2} />
                        <QuickAction title="Idle Mode" desc="Earn while sleeping" delay={0.3} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const QuickAction = ({ title, desc, delay }: { title: string; desc: string; delay: number }) => (
    <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.4 }}
        className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-purple/50 hover:bg-white/10 transition-all group text-left"
    >
        <h3 className="font-bold text-white group-hover:text-neon-purple transition-colors">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
    </motion.button>
);
