// LuxRig Panel - Real-time monitoring of local LM Studio/Ollama + Bridge
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Cpu, HardDrive, CheckCircle, XCircle, Loader, Trash2, Link } from 'lucide-react';
import { ollamaService, type OllamaModel } from '../cortex/OllamaService';
import { luxRigBridge, type LuxRigStatus } from '../cortex/LuxRigBridge';
import { clsx } from 'clsx';

export const LuxRigPanel = () => {
    const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<OllamaModel | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Bridge status
    const [bridgeOnline, setBridgeOnline] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState<LuxRigStatus | null>(null);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        // Check Ollama directly
        const health = await ollamaService.checkHealth();
        setStatus(health ? 'online' : 'offline');

        if (health) {
            const availableModels = await ollamaService.listModels();
            setModels(availableModels);
        }

        // Check LuxRig Bridge
        const bridgeHealth = await luxRigBridge.checkHealth();
        setBridgeOnline(bridgeHealth);

        if (bridgeHealth) {
            const bridgeStatusData = await luxRigBridge.getStatus();
            setBridgeStatus(bridgeStatusData);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await checkStatus();
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleDeleteModel = async (modelName: string) => {
        if (!confirm(`Delete model "${modelName}"? This cannot be undone.`)) return;

        const success = await ollamaService.deleteModel(modelName);
        if (success) {
            await checkStatus();
        }
    };

    return (
        <div className="h-full overflow-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-hologram-cyan glow-text">LuxRig Status</h1>
                    <p className="text-gray-400 mt-1">Local AI Infrastructure Monitor</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="glass-panel px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                    <Loader className={clsx("w-4 h-4", refreshing && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Bridge Status Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-xl border border-purple-500/30"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "p-3 rounded-lg",
                            bridgeOnline ? "bg-purple-500/20" : "bg-red-500/20"
                        )}>
                            <Link className={clsx(
                                "w-6 h-6",
                                bridgeOnline ? "text-purple-400" : "text-red-400"
                            )} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">LuxRig Bridge</h2>
                            <p className="text-gray-400">Phoenix ↔ LuxRig Connection</p>
                        </div>
                    </div>
                    {bridgeOnline ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                    )}
                </div>

                {bridgeOnline && bridgeStatus && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="glass-panel p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Cpu className="w-4 h-4 text-hologram-cyan" />
                                <span className="font-semibold">LM Studio</span>
                            </div>
                            <p className={clsx(
                                "text-sm",
                                bridgeStatus.lmstudio.online ? "text-green-400" : "text-red-400"
                            )}>
                                {bridgeStatus.lmstudio.online ? "ONLINE" : "OFFLINE"}
                            </p>
                        </div>
                        <div className="glass-panel p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Server className="w-4 h-4 text-hologram-cyan" />
                                <span className="font-semibold">Ollama</span>
                            </div>
                            <p className={clsx(
                                "text-sm",
                                bridgeStatus.ollama.online ? "text-green-400" : "text-red-400"
                            )}>
                                {bridgeStatus.ollama.online ? "ONLINE" : "OFFLINE"}
                            </p>
                            {bridgeStatus.ollama.models && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {bridgeStatus.ollama.models.length} models
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {!bridgeOnline && (
                    <div className="text-center py-4">
                        <p className="text-red-400 mb-2">Bridge Offline</p>
                        <p className="text-sm text-gray-400">Start the bridge server:</p>
                        <code className="glass-panel px-4 py-2 rounded text-sm text-hologram-cyan mt-2 inline-block">
                            cd LuxRig-Bridge && npm start
                        </code>
                    </div>
                )}
            </motion.div>

            {/* Ollama Status Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-xl border border-hologram-cyan/30"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "p-3 rounded-lg",
                            status === 'online' && "bg-green-500/20",
                            status === 'offline' && "bg-red-500/20",
                            status === 'checking' && "bg-yellow-500/20"
                        )}>
                            <Server className={clsx(
                                "w-6 h-6",
                                status === 'online' && "text-green-400",
                                status === 'offline' && "text-red-400",
                                status === 'checking' && "text-yellow-400"
                            )} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Ollama Server</h2>
                            <p className="text-sm text-gray-400">localhost:11434</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {status === 'online' && (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-semibold">Online</span>
                            </>
                        )}
                        {status === 'offline' && (
                            <>
                                <XCircle className="w-5 h-5 text-red-400" />
                                <span className="text-red-400 font-semibold">Offline</span>
                            </>
                        )}
                        {status === 'checking' && (
                            <>
                                <Loader className="w-5 h-5 text-yellow-400 animate-spin" />
                                <span className="text-yellow-400 font-semibold">Checking...</span>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Models Grid */}
            {status === 'online' && models.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-hologram-blue glow-text">
                        Available Models ({models.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {models.map((model, idx) => (
                            <motion.div
                                key={model.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelectedModel(model)}
                                className={clsx(
                                    "glass-panel p-4 rounded-lg cursor-pointer transition-all border",
                                    selectedModel?.name === model.name
                                        ? "border-hologram-cyan shadow-lg shadow-hologram-cyan/20"
                                        : "border-white/10 hover:border-hologram-cyan/50"
                                )}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white truncate">{model.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {ollamaService.formatModelSize(model.size)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteModel(model.name);
                                        }}
                                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                    <Cpu className="w-3 h-3 text-hologram-blue" />
                                    <span className="text-gray-400">
                                        {model.details?.parameter_size || 'Unknown params'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Model Details */}
            {selectedModel && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6 rounded-xl border border-hologram-blue/30"
                >
                    <h2 className="text-2xl font-bold mb-4 text-hologram-cyan glow-text">
                        Model Details
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Name:</span>
                            <span className="font-semibold text-white">{selectedModel.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Size:</span>
                            <span className="font-semibold text-white">
                                {ollamaService.formatModelSize(selectedModel.size)}
                            </span>
                        </div>
                        {selectedModel.details?.parameter_size && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Parameters:</span>
                                <span className="font-semibold text-white">
                                    {selectedModel.details.parameter_size}
                                </span>
                            </div>
                        )}
                        {selectedModel.details?.quantization_level && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Quantization:</span>
                                <span className="font-semibold text-white">
                                    {selectedModel.details.quantization_level}
                                </span>
                            </div>
                        )}
                        {selectedModel.details?.family && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Family:</span>
                                <span className="font-semibold text-white">
                                    {selectedModel.details.family}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-400">Last Modified:</span>
                            <span className="font-semibold text-white">
                                {new Date(selectedModel.modified_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Empty State */}
            {status === 'online' && models.length === 0 && (
                <div className="glass-panel p-12 rounded-xl text-center">
                    <HardDrive className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold mb-2">No Models Found</h3>
                    <p className="text-gray-400 mb-4">
                        Pull a model using Ollama CLI to get started
                    </p>
                    <code className="glass-panel px-4 py-2 rounded text-sm text-hologram-cyan">
                        ollama pull llama3.2
                    </code>
                </div>
            )}

            {/* Offline State */}
            {status === 'offline' && (
                <div className="glass-panel p-12 rounded-xl text-center border border-red-500/30">
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <h3 className="text-xl font-semibold mb-2 text-red-400">Ollama Offline</h3>
                    <p className="text-gray-400 mb-4">
                        Make sure Ollama is running on your system
                    </p>
                    <code className="glass-panel px-4 py-2 rounded text-sm text-gray-400">
                        http://localhost:11434
                    </code>
                </div>
            )}
        </div>
    );
};
