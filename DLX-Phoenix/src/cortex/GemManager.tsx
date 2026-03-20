import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore, type Gem } from '../vault/Store';
import { Gem as GemIcon, Plus, Check } from 'lucide-react';
import { clsx } from 'clsx';

export const GemManager = () => {
    const { gems, activeGemId, addGem, setActiveGem } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newGem, setNewGem] = useState<Partial<Gem>>({
        name: '',
        systemInstructions: '',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        color: 'text-hologram-blue'
    });

    const handleCreate = () => {
        if (!newGem.name || !newGem.systemInstructions) return;

        const gem: Gem = {
            id: `g-${Date.now()}`,
            name: newGem.name,
            systemInstructions: newGem.systemInstructions,
            provider: newGem.provider as any,
            model: newGem.model || 'gemini-1.5-flash',
            color: newGem.color || 'text-hologram-blue'
        };

        addGem(gem);
        setIsCreating(false);
        setNewGem({ name: '', systemInstructions: '', provider: 'gemini', model: 'gemini-1.5-flash', color: 'text-hologram-blue' });
    };

    return (
        <div className="h-full flex flex-col gap-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <GemIcon className="text-neon-purple" />
                    Gem Nexus
                </h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    New Persona
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gems.map(gem => (
                    <motion.div
                        key={gem.id}
                        layoutId={gem.id}
                        onClick={() => setActiveGem(gem.id)}
                        className={clsx(
                            "p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden group",
                            activeGemId === gem.id
                                ? "bg-neon-purple/10 border-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.2)]"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                    >
                        {activeGemId === gem.id && (
                            <div className="absolute top-2 right-2 text-neon-purple">
                                <Check size={16} />
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-3">
                            <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center bg-black/40", gem.color)}>
                                <GemIcon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{gem.name}</h3>
                                <div className="text-xs text-gray-400 capitalize">{gem.provider}</div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 line-clamp-2 h-8">
                            {gem.systemInstructions}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Creation Modal Overlay */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-md space-y-4"
                    >
                        <h3 className="text-lg font-bold text-white">Inject New Persona</h3>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Gem Name</label>
                            <input
                                type="text"
                                value={newGem.name}
                                onChange={e => setNewGem({ ...newGem, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-neon-purple outline-none"
                                placeholder="e.g. Code Ninja"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">System Instructions (Prompt)</label>
                            <textarea
                                value={newGem.systemInstructions}
                                onChange={e => setNewGem({ ...newGem, systemInstructions: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-neon-purple outline-none h-32 resize-none"
                                placeholder="You are an expert Python developer..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Provider</label>
                                <select
                                    value={newGem.provider}
                                    onChange={e => setNewGem({ ...newGem, provider: e.target.value as any })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-neon-purple outline-none"
                                >
                                    <option value="gemini">Gemini</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Color</label>
                                <select
                                    value={newGem.color}
                                    onChange={e => setNewGem({ ...newGem, color: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-neon-purple outline-none"
                                >
                                    <option value="text-hologram-blue">Hologram Blue</option>
                                    <option value="text-neon-purple">Neon Purple</option>
                                    <option value="text-green-400">Matrix Green</option>
                                    <option value="text-red-500">System Red</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex-1 px-4 py-2 rounded-lg bg-neon-purple text-white hover:bg-neon-purple/80"
                            >
                                Inject
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
