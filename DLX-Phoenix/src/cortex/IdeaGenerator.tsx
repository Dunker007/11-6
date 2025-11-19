import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { useStore, type Idea } from '../vault/Store';
import { generateIdea } from './aiService';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
}

export const IdeaGenerator = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'ai', content: 'Systems online. Ready to forge new revenue streams. What are your parameters?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const { addIdea, gems, activeGemId } = useStore();
    const activeGem = gems.find(g => g.id === activeGemId);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Call Real AI Service with Gem Persona
            const content = await generateIdea(input, activeGem?.systemInstructions);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);

            // Auto-save to Vault
            const newIdea: Idea = {
                id: aiMsg.id,
                content: content,
                timestamp: Date.now(),
                tags: ['AI', 'Generated', 'Business'],
                isFavorite: false
            };
            addIdea(newIdea);
        } catch (error) {
            console.error(error);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                content: 'Error: Neural link unstable. Please retry.'
            }]);
        }
    };

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col glass rounded-2xl overflow-hidden border border-white/10">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon-purple/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-neon-purple animate-pulse-glow" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white tracking-wide">IDEA FORGE</h2>
                        <div className="text-xs text-hologram-blue flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            LINKED: {activeGem?.name || 'Unknown Entity'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-neon-purple/20 text-neon-purple' : 'bg-hologram-blue/20 text-hologram-blue'
                                }`}>
                                {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
                            </div>

                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai'
                                ? 'bg-white/5 border border-white/5 text-gray-300'
                                : 'bg-hologram-blue/10 border border-hologram-blue/20 text-white'
                                }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4"
                    >
                        <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center text-neon-purple">
                            <Bot size={18} />
                        </div>
                        <div className="flex gap-1 items-center h-8">
                            <span className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/20 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Input parameters for generation..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-hologram-blue/50 focus:bg-white/10 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="p-3 bg-hologram-blue/20 text-hologram-blue rounded-xl hover:bg-hologram-blue/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
