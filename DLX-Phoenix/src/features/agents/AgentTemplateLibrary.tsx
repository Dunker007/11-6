import { motion } from 'framer-motion';
import { Copy, Star, Zap, Code, PenTool, Search, Briefcase } from 'lucide-react';
import { agentTemplateService } from './AgentTemplateService';
import type { AgentTemplate } from './AgentTemplateService';

interface AgentTemplateLibraryProps {
    onSelectTemplate: (template: AgentTemplate) => void;
}

export function AgentTemplateLibrary({ onSelectTemplate }: AgentTemplateLibraryProps) {
    const templates = agentTemplateService.getTemplates();

    const getIcon = (category: string) => {
        switch (category) {
            case 'coding': return <Code className="w-5 h-5 text-blue-400" />;
            case 'writing': return <PenTool className="w-5 h-5 text-purple-400" />;
            case 'business': return <Briefcase className="w-5 h-5 text-green-400" />;
            case 'research': return <Search className="w-5 h-5 text-yellow-400" />;
            default: return <Zap className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Agent Templates</h2>
                    <p className="text-gray-400">Jumpstart your automation with pre-built professionals.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 cursor-pointer hover:border-blue-500/50 transition-colors group"
                        onClick={() => onSelectTemplate(template)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                {getIcon(template.category)}
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                <Star className="w-4 h-4 fill-current" />
                                <span>{template.popularity}</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">
                            {template.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex gap-2">
                                {template.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <button className="p-2 rounded-full bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
