import { motion } from 'framer-motion';
import { useStore } from '../vault/Store';
import { calculateTickRevenue } from './economy/RevenueEngine';
import { Cpu, Plus, Dna, Box, Brain } from 'lucide-react';
import { clsx } from 'clsx';

export const NeuralMining = () => {
    const { nodes, networkLoad, missions, toggleNodeStatus, deployNode } = useStore();

    const getJobIcon = (type: string) => {
        switch (type) {
            case 'folding': return <Dna size={20} />;
            case 'rendering': return <Box size={20} />;
            case 'inference': return <Brain size={20} />;
            default: return <Cpu size={20} />;
        }
    };

    const getJobColor = (type: string) => {
        switch (type) {
            case 'folding': return 'text-green-400 bg-green-400/20 border-green-400/50';
            case 'rendering': return 'text-neon-purple bg-neon-purple/20 border-neon-purple/50';
            case 'inference': return 'text-hologram-blue bg-hologram-blue/20 border-hologram-blue/50';
            default: return 'text-gray-400 bg-white/10 border-white/20';
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Active Missions Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {missions.map(mission => (
                    <div key={mission.id} className="glass p-4 rounded-xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full opacity-20" />
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className={clsx("p-2 rounded-lg", getJobColor(mission.type))}>
                                    {getJobIcon(mission.type)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{mission.name}</div>
                                    <div className="text-xs text-gray-400">{mission.reward}</div>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-hologram-blue bg-hologram-blue/10 px-2 py-1 rounded">
                                {mission.status.toUpperCase()}
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{mission.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${mission.progress}%` }}
                                    className={clsx("h-full rounded-full",
                                        mission.type === 'folding' ? 'bg-green-400' :
                                            mission.type === 'rendering' ? 'bg-neon-purple' : 'bg-hologram-blue'
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Visualizer Area */}
            <div className="flex-1 glass rounded-2xl border border-white/10 relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                {/* Grid Background */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}
                />

                <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {nodes.map((node) => (
                        <motion.div
                            key={node.id}
                            layoutId={node.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => toggleNodeStatus(node.id)}
                            className={clsx(
                                "relative p-4 rounded-xl border cursor-pointer transition-all duration-300 group overflow-hidden",
                                node.status === 'mining'
                                    ? "bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                    : "bg-black/40 border-white/10 hover:border-white/30",
                                node.status === 'mining' && node.jobType === 'folding' ? "border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]" :
                                    node.status === 'mining' && node.jobType === 'rendering' ? "border-neon-purple/50 shadow-[0_0_15px_rgba(188,19,254,0.2)]" :
                                        node.status === 'mining' ? "border-hologram-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.2)]" : ""
                            )}
                        >
                            {/* Scanning Line Effect */}
                            {node.status === 'mining' && (
                                <motion.div
                                    className={clsx("absolute inset-0 bg-gradient-to-b from-transparent to-transparent opacity-20",
                                        node.jobType === 'folding' ? "via-green-400/20" :
                                            node.jobType === 'rendering' ? "via-neon-purple/20" : "via-hologram-blue/20"
                                    )}
                                    animate={{ top: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className={clsx(
                                    "p-2 rounded-lg border",
                                    node.status === 'mining' ? getJobColor(node.jobType) : "bg-white/5 text-gray-400 border-transparent"
                                )}>
                                    {getJobIcon(node.jobType)}
                                </div>
                                <div className={clsx(
                                    "w-2 h-2 rounded-full",
                                    node.status === 'mining' ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : "bg-gray-600"
                                )} />
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-white text-sm">{node.name}</h3>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span className="capitalize">{node.jobType}</span>
                                    <span>{node.efficiency}% Eff</span>
                                </div>
                                {node.status === 'mining' && (
                                    <div className="text-xs font-mono text-hologram-blue mt-1">
                                        +{calculateTickRevenue(node.hardwareTier, node.jobType, node.efficiency, networkLoad)} CR/s
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Add Node Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deployNode('gpu')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-white/20 hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all group h-[140px]"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-neon-purple/20 transition-colors">
                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-neon-purple" />
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-white">Deploy Node</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
