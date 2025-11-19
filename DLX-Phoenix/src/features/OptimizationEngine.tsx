import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../vault/Store';
import { Zap, TrendingUp, Cpu, Activity, Settings2 } from 'lucide-react';
import { clsx } from 'clsx';

export const OptimizationEngine = () => {
    const { nodes, networkLoad, addCredits } = useStore();
    const [autoOptimize, setAutoOptimize] = useState(false);
    const [optimizationLevel, setOptimizationLevel] = useState(0);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Calculate current efficiency
    const avgEfficiency = nodes.length > 0
        ? nodes.reduce((sum, n) => sum + n.efficiency, 0) / nodes.length
        : 0;

    const networkEfficiency = 100 - Math.abs(50 - networkLoad);

    // Auto-optimization effect
    useEffect(() => {
        if (autoOptimize && !isOptimizing) {
            const interval = setInterval(() => {
                runOptimization();
            }, 10000); // Run every 10 seconds

            return () => clearInterval(interval);
        }
    }, [autoOptimize, isOptimizing]);

    const runOptimization = async () => {
        setIsOptimizing(true);

        // Simulate optimization process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Grant optimization bonus
        const bonus = Math.floor(Math.random() * 50) + 25;
        addCredits(bonus);

        setOptimizationLevel(prev => Math.min(100, prev + 5));
        setIsOptimizing(false);
    };

    const optimizationMetrics = [
        {
            label: 'Node Efficiency',
            value: avgEfficiency.toFixed(1),
            max: 100,
            color: 'text-hologram-blue',
            bgColor: 'bg-hologram-blue'
        },
        {
            label: 'Network Balance',
            value: networkEfficiency.toFixed(1),
            max: 100,
            color: 'text-neon-purple',
            bgColor: 'bg-neon-purple'
        },
        {
            label: 'Optimization Level',
            value: optimizationLevel.toFixed(0),
            max: 100,
            color: 'text-green-400',
            bgColor: 'bg-green-400'
        },
    ];

    return (
        <div className="h-full flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="text-neon-purple" />
                    Optimization Engine
                </h2>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Auto-Optimize</span>
                    <button
                        onClick={() => setAutoOptimize(!autoOptimize)}
                        className={clsx(
                            "relative w-12 h-6 rounded-full transition-colors",
                            autoOptimize ? "bg-neon-purple" : "bg-gray-700"
                        )}
                    >
                        <motion.div
                            className="absolute top-1 w-4 h-4 bg-white rounded-full"
                            animate={{ left: autoOptimize ? 28 : 4 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
                {optimizationMetrics.map((metric, idx) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass p-4 rounded-xl border border-white/10"
                    >
                        <div className="text-xs text-gray-400 mb-2">{metric.label}</div>
                        <div className={`text-2xl font-bold ${metric.color} mb-3`}>
                            {metric.value}%
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${metric.bgColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Optimization Actions */}
            <div className="glass p-6 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-hologram-blue" />
                    Manual Optimization
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={runOptimization}
                        disabled={isOptimizing}
                        className={clsx(
                            "px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2",
                            isOptimizing
                                ? "bg-gray-700 text-gray-500"
                                : "bg-hologram-blue/20 text-hologram-blue hover:bg-hologram-blue/30"
                        )}
                    >
                        <TrendingUp className="w-5 h-5" />
                        {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
                    </button>

                    <button
                        className="px-4 py-3 bg-neon-purple/20 text-neon-purple rounded-lg font-bold hover:bg-neon-purple/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Cpu className="w-5 h-5" />
                        Tune Parameters
                    </button>
                </div>

                {isOptimizing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 p-3 bg-hologram-blue/10 border border-hologram-blue/20 rounded-lg"
                    >
                        <div className="flex items-center gap-2 text-hologram-blue text-sm">
                            <Activity className="w-4 h-4 animate-pulse" />
                            Running optimization algorithms...
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Optimization Tips */}
            <div className="glass p-6 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-3">Optimization Tips</h3>
                <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-hologram-blue mt-1.5" />
                        <div>Keep network load balanced around 50% for optimal efficiency</div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-1.5" />
                        <div>Higher tier hardware automatically provides better base efficiency</div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                        <div>Auto-optimization provides passive bonuses every 10 seconds</div>
                    </div>
                </div>
            </div>

            {/* Live Performance Monitor */}
            <div className="glass p-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-sm">Live Performance</h3>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-400">ACTIVE</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                        <div className="text-xs text-gray-500">Active Nodes</div>
                        <div className="text-lg font-bold text-white">
                            {nodes.filter(n => n.status === 'mining').length}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Avg Efficiency</div>
                        <div className="text-lg font-bold text-hologram-blue">
                            {avgEfficiency.toFixed(0)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Network Load</div>
                        <div className="text-lg font-bold text-neon-purple">
                            {networkLoad.toFixed(0)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Optimization</div>
                        <div className="text-lg font-bold text-green-400">
                            {optimizationLevel.toFixed(0)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
