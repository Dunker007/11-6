import { motion } from 'framer-motion';
import { useStore } from '../vault/Store';
import { Shield, Zap, Box, CheckCircle, Circle, Brain } from 'lucide-react';
import { clsx } from 'clsx';

export const ModuleMatrix = () => {
    const { modules, toggleModule } = useStore();

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-hologram-blue/20 rounded-xl">
                        <Box className="w-6 h-6 text-hologram-blue" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Module Matrix</h2>
                        <p className="text-gray-400">System capabilities and plugins</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white font-mono">
                        {modules.filter(m => m.installed).length} / {modules.length}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Active Modules</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <motion.div
                        key={module.id}
                        layoutId={module.id}
                        className={clsx(
                            "relative p-6 rounded-2xl border transition-all duration-300 group overflow-hidden",
                            module.installed
                                ? "bg-hologram-blue/5 border-hologram-blue/50 shadow-[0_0_20px_rgba(0,243,255,0.1)]"
                                : "bg-black/40 border-white/10 hover:border-white/30"
                        )}
                    >
                        {/* Background Grid Effect */}
                        <div
                            className="absolute inset-0 opacity-5 pointer-events-none"
                            style={{
                                backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .3) 25%, rgba(255, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .3) 75%, rgba(255, 255, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .3) 25%, rgba(255, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .3) 75%, rgba(255, 255, 255, .3) 76%, transparent 77%, transparent)',
                                backgroundSize: '30px 30px'
                            }}
                        />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={clsx(
                                    "p-3 rounded-xl",
                                    module.installed ? "bg-hologram-blue/20 text-hologram-blue" : "bg-white/5 text-gray-400"
                                )}>
                                    {module.name.includes('Router') ? <Zap size={24} /> :
                                        module.name.includes('Lace') ? <Brain size={24} /> :
                                            module.name.includes('Core') ? <Box size={24} /> :
                                                <Shield size={24} />}
                                </div>
                                <div className={clsx(
                                    "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border",
                                    module.rarity === 'legendary' ? "border-yellow-500/50 text-yellow-500 bg-yellow-500/10" :
                                        module.rarity === 'rare' ? "border-neon-purple/50 text-neon-purple bg-neon-purple/10" :
                                            "border-gray-500/50 text-gray-400 bg-gray-500/10"
                                )}>
                                    {module.rarity}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{module.name}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                                {module.description}
                            </p>

                            <button
                                onClick={() => toggleModule(module.id)}
                                className={clsx(
                                    "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                                    module.installed
                                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                        : "bg-hologram-blue/10 text-hologram-blue hover:bg-hologram-blue/20 border border-hologram-blue/20"
                                )}
                            >
                                {module.installed ? (
                                    <>
                                        <Circle size={18} /> Deactivate
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} /> Activate
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
