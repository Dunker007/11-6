import { motion } from 'framer-motion';
import { useStore } from '../vault/Store';
import { calculateTickRevenue } from '../features/economy/RevenueEngine';
import { Activity, Cpu, Zap, Database, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
    const { credits, nodes, ideas, networkLoad } = useStore();

    const activeNodes = nodes.filter(n => n.status === 'mining').length;
    const totalEfficiency = nodes.reduce((acc, n) => acc + n.efficiency, 0) / (nodes.length || 1);

    const totalRevenuePerSecond = nodes
        .filter(n => n.status === 'mining')
        .reduce((acc, n) => acc + calculateTickRevenue(n.hardwareTier, n.jobType, n.efficiency, networkLoad), 0);

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-xl border border-hologram-blue/20">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-hologram-blue/10 rounded-lg text-hologram-blue">
                            <Zap size={20} />
                        </div>
                        <span className="text-xs text-hologram-blue font-mono bg-hologram-blue/10 px-2 py-1 rounded">+{totalRevenuePerSecond.toFixed(2)}/s</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">{credits.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Credits</div>
                </div>

                <div className="glass p-4 rounded-xl border border-neon-purple/20">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-neon-purple/10 rounded-lg text-neon-purple">
                            <Cpu size={20} />
                        </div>
                        <span className="text-xs text-neon-purple font-mono bg-neon-purple/10 px-2 py-1 rounded">{activeNodes} Active</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">{nodes.length} Nodes</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Compute Grid</div>
                </div>

                <div className="glass p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-white/5 rounded-lg text-white">
                            <Database size={20} />
                        </div>
                        <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-1 rounded">Vault</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">{ideas.length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Generated Ideas</div>
                </div>

                <div className="glass p-4 rounded-xl border border-green-500/20">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <Activity size={20} />
                        </div>
                        <span className="text-xs text-green-400 font-mono bg-green-500/10 px-2 py-1 rounded">{networkLoad}% Load</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">{Math.round(totalEfficiency)}%</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Avg Efficiency</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Live Feed / Activity Log */}
                <div className="lg:col-span-2 glass rounded-2xl border border-white/10 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Activity size={18} className="text-hologram-blue" />
                            System Activity
                        </h3>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs text-red-400 font-mono">LIVE</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-0 space-y-4 overflow-y-auto pr-2">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="text-xs font-mono text-gray-500">10:42:{30 + i}</div>
                                    <div className="w-1 h-8 bg-hologram-blue/20 rounded-full" />
                                    <div>
                                        <div className="text-sm text-gray-300">
                                            {i === 0 ? 'Neural network optimization complete' :
                                                i === 1 ? 'New revenue stream identified: Sector 7G' :
                                                    i === 2 ? 'Background mining efficiency increased by 4.2%' :
                                                        'System diagnostic run: All systems nominal'}
                                        </div>
                                        <div className="text-xs text-hologram-blue mt-1">Module: Cortex-Alpha</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Mini Graph */}
                <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-neon-purple" />
                            Performance
                        </h3>
                        <div className="h-32 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden flex items-end justify-between px-2 pb-2">
                            {/* Fake Graph Bars */}
                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="w-1/12 bg-neon-purple/50 rounded-t-sm hover:bg-neon-purple transition-colors"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-gradient-to-br from-hologram-blue/10 to-transparent rounded-xl p-4 border border-hologram-blue/20 flex flex-col justify-center items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-hologram-blue/20 flex items-center justify-center mb-3 animate-pulse-glow">
                            <Zap className="text-hologram-blue" />
                        </div>
                        <h4 className="font-bold text-white">Boost Active</h4>
                        <p className="text-xs text-gray-400 mt-1">2x Multiplier for 1h</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
