import { motion } from 'framer-motion';
import { useStore } from './Store';
import { Database, Tag, Star, Trash2 } from 'lucide-react';

export const Vault = () => {
    const { ideas } = useStore();

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-neon-purple/20 rounded-xl">
                        <Database className="w-6 h-6 text-neon-purple" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Data Vault</h2>
                        <p className="text-gray-400">Secure storage for generated assets</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white font-mono">{ideas.length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Records</div>
                </div>
            </div>

            {ideas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                    <Database size={48} className="mb-4 opacity-50" />
                    <p>Vault is empty. Generate ideas to populate.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                    {ideas.map((idea, index) => (
                        <motion.div
                            key={idea.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass p-6 rounded-2xl border border-white/10 hover:border-hologram-blue/50 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors">
                                    <Star size={16} />
                                </button>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mb-4 flex gap-2 flex-wrap">
                                {idea.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-400 flex items-center gap-1 border border-white/5">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>

                            <p className="text-gray-200 leading-relaxed mb-4">
                                {idea.content}
                            </p>

                            <div className="text-xs text-gray-500 font-mono">
                                ID: {idea.id.substring(0, 8)} • {new Date(idea.timestamp).toLocaleDateString()}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
