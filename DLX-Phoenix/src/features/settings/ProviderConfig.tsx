import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../vault/Store';
import { aiService } from '../../cortex/aiService';
import { Key, CheckCircle, XCircle, Loader } from 'lucide-react';

export const ProviderConfig = () => {
    const { providerConfigs, updateProviderConfig } = useStore();
    const [localConfigs, setLocalConfigs] = useState(providerConfigs);
    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
        openai: 'idle',
        anthropic: 'idle',
        ollama: 'idle'
    });

    useEffect(() => {
        setLocalConfigs(providerConfigs);
    }, [providerConfigs]);

    const handleSave = (provider: 'openai' | 'anthropic' | 'ollama') => {
        updateProviderConfig(provider, localConfigs[provider]);

        // Persist to localStorage for aiService
        if (provider === 'openai') {
            localStorage.setItem('openai_api_key', localConfigs.openai.apiKey);
        } else if (provider === 'anthropic') {
            localStorage.setItem('anthropic_api_key', localConfigs.anthropic.apiKey);
        }
    };

    const handleTest = async (provider: 'openai' | 'anthropic' | 'ollama') => {
        setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));

        try {
            // Save first so aiService uses the latest config
            handleSave(provider);

            const isAvailable = await aiService.checkProviderStatus(provider);

            if (isAvailable) {
                // Try a simple test generation
                await aiService.generateWithProvider(provider, 'Hello, testing connection. Respond with just "OK".');
                setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
            } else {
                setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
            }
        } catch (error) {
            console.error(`${provider} test failed:`, error);
            setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'testing':
                return <Loader className="w-4 h-4 animate-spin text-hologram-blue" />;
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="text-neon-purple" />
                Provider Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* OpenAI */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl border border-white/10"
                >
                    <h3 className="font-bold text-white mb-3 flex items-center justify-between">
                        OpenAI
                        {getStatusIcon(testStatus.openai)}
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400">API Key</label>
                            <input
                                type="password"
                                value={localConfigs.openai.apiKey}
                                onChange={(e) => setLocalConfigs({
                                    ...localConfigs,
                                    openai: { ...localConfigs.openai, apiKey: e.target.value }
                                })}
                                placeholder="sk-proj-..."
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400">Model</label>
                            <select
                                value={localConfigs.openai.model}
                                onChange={(e) => setLocalConfigs({
                                    ...localConfigs,
                                    openai: { ...localConfigs.openai, model: e.target.value }
                                })}
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none"
                            >
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4o-mini">GPT-4o Mini (Cheap)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSave('openai')}
                                className="flex-1 px-3 py-2 bg-hologram-blue/20 text-hologram-blue rounded-lg hover:bg-hologram-blue/30 text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleTest('openai')}
                                disabled={testStatus.openai === 'testing'}
                                className="flex-1 px-3 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 text-sm disabled:opacity-50"
                            >
                                Test
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Anthropic */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-4 rounded-xl border border-white/10"
                >
                    <h3 className="font-bold text-white mb-3 flex items-center justify-between">
                        Anthropic
                        {getStatusIcon(testStatus.anthropic)}
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400">API Key</label>
                            <input
                                type="password"
                                value={localConfigs.anthropic.apiKey}
                                onChange={(e) => setLocalConfigs({
                                    ...localConfigs,
                                    anthropic: { ...localConfigs.anthropic, apiKey: e.target.value }
                                })}
                                placeholder="sk-ant-..."
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400">Model</label>
                            <select
                                value={localConfigs.anthropic.model}
                                onChange={(e) => setLocalConfigs({
                                    ...localConfigs,
                                    anthropic: { ...localConfigs.anthropic, model: e.target.value }
                                })}
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none"
                            >
                                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSave('anthropic')}
                                className="flex-1 px-3 py-2 bg-hologram-blue/20 text-hologram-blue rounded-lg hover:bg-hologram-blue/30 text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleTest('anthropic')}
                                disabled={testStatus.anthropic === 'testing'}
                                className="flex-1 px-3 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 text-sm disabled:opacity-50"
                            >
                                Test
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Ollama (Local) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-4 rounded-xl border border-white/10"
                >
                    <h3 className="font-bold text-white mb-3 flex items-center justify-between">
                        Ollama (Local)
                        {getStatusIcon(testStatus.ollama)}
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400">Base URL</label>
                            <input
                                type="text"
                                value={localConfigs.ollama.baseUrl}
                                onChange={(e) => setLocalConfigs({
                                    ...localConfigs,
                                    ollama: { ...localConfigs.ollama, baseUrl: e.target.value }
                                })}
                                placeholder="http://localhost:11434"
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400">Model</label>
                            <input
                                type="text"
                                value={localConfigs.ollama.model}
                                onChange={(e) => setLocalConfigs({
                                    ...localConfigs,
                                    ollama: { ...localConfigs.ollama, model: e.target.value }
                                })}
                                placeholder="llama3.2, mistral, etc."
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none"
                            />
                        </div>

                        <div className="text-xs text-gray-500 mb-2">
                            💡 Zero cost! Download Ollama from ollama.com
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSave('ollama')}
                                className="flex-1 px-3 py-2 bg-hologram-blue/20 text-hologram-blue rounded-lg hover:bg-hologram-blue/30 text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleTest('ollama')}
                                disabled={testStatus.ollama === 'testing'}
                                className="flex-1 px-3 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 text-sm disabled:opacity-50"
                            >
                                Test
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Info Panel */}
            <div className="glass p-4 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-2">Multi-Provider Strategy</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Each <span className="text-neon-purple">Gem</span> can use a different provider. Mix Gemini for speed, Claude for reasoning, OpenAI for creativity, or Ollama for zero-cost local inference.
                </p>
            </div>
        </div>
    );
};
