import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../vault/Store';
import { agentService, createAgentTask } from '../agents/AgentService';
import type { AgentTaskType } from '../agents/AgentService';
import { Play, Download, Clock, CheckCircle, XCircle, Code, FileText, Search, Loader, LayoutTemplate, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { AgentTemplateLibrary } from './agents/AgentTemplateLibrary';
import type { AgentTemplate } from './agents/AgentTemplateService';
import { LevelUpModal } from './gamification/LevelUpModal';
import { AssistantPanel } from './assistant/AssistantPanel';

export const AgentStudio = () => {
    const { gems, activeGemId, agentTasks, addAgentTask, updateAgentTask } = useStore();
    const activeGem = gems.find(g => g.id === activeGemId);

    const [viewMode, setViewMode] = useState<'create' | 'templates' | 'assistant'>('create');
    const [selectedTaskType, setSelectedTaskType] = useState<AgentTaskType>('code-generation');
    const [taskName, setTaskName] = useState('');
    const [taskPrompt, setTaskPrompt] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    const taskTypes: { type: AgentTaskType; icon: any; label: string; description: string; available: boolean }[] = [
        { type: 'code-generation', icon: Code, label: 'Code Generation', description: 'Generate code files (JS, TS, Python, etc.)', available: true },
        { type: 'research', icon: Search, label: 'Research', description: 'Research topics and create summaries', available: true },
        { type: 'content-writing', icon: FileText, label: 'Content Writing', description: 'Generate articles, blog posts, copy', available: true },
        { type: 'web-scraping', icon: Search, label: 'Web Scraping', description: 'Extract data from websites (Coming Soon)', available: false },
        { type: 'api-testing', icon: Code, label: 'API Testing', description: 'Test REST APIs automatically (Coming Soon)', available: false },
    ];

    const handleSelectTemplate = (template: AgentTemplate) => {
        setTaskName(template.name);
        setTaskPrompt(`${template.systemInstructions}\n\nGoal: ${template.goal}`);

        // Map category to task type
        let type: AgentTaskType = 'content-writing';
        if (template.category === 'coding') type = 'code-generation';
        if (template.category === 'research') type = 'research';
        if (template.category === 'business') type = 'research';

        setSelectedTaskType(type);
        setViewMode('create');
    };

    const handleRunTask = async () => {
        if (!activeGem || !taskName.trim() || !taskPrompt.trim()) return;

        setIsRunning(true);

        // Create task
        const task = createAgentTask(selectedTaskType, taskName, taskPrompt, activeGem);

        // Add to store
        addAgentTask(task);

        // Update status to running
        updateAgentTask(task.id, { status: 'running', progress: 50 });

        try {
            // Execute task
            const result = await agentService.executeTask(task);

            if (result.success) {
                updateAgentTask(task.id, {
                    status: 'completed',
                    progress: 100,
                    result: result.output,
                    outputPath: result.outputPath,
                    completedAt: Date.now()
                });
            } else {
                updateAgentTask(task.id, {
                    status: 'failed',
                    progress: 0,
                    error: result.error,
                    completedAt: Date.now()
                });
            }
        } catch (error) {
            updateAgentTask(task.id, {
                status: 'failed',
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
                completedAt: Date.now()
            });
        }

        setIsRunning(false);
        setTaskName('');
        setTaskPrompt('');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running':
                return <Loader className="w-4 h-4 animate-spin text-hologram-blue" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const downloadResult = (task: any) => {
        if (!task.result) return;

        const blob = new Blob([task.result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = task.outputPath?.split('/').pop() || `${task.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex gap-6 p-6">
            {/* Left: Task Creator or Templates */}
            <div className="w-1/2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {viewMode === 'create' ? (
                            <>
                                <Play className="text-neon-purple" />
                                Agent Studio
                            </>
                        ) : (
                            <>
                                <button onClick={() => setViewMode('create')} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                                </button>
                                Template Library
                            </>
                        )}
                    </h2>

                    {viewMode === 'create' && (
                        <button
                            onClick={() => setViewMode('templates')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors border border-white/10"
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Browse Templates
                        </button>
                <button
                            onClick={() => setViewMode('assistant')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors border border-white/10"
                        >
                            <Play className="w-4 h-4" />
                            Assistant
                        </button>
                    )}
                </div>

                {viewMode === 'templates' ? (
                    <div className="flex-1 overflow-y-auto pr-2">
                        <AgentTemplateLibrary onSelectTemplate={handleSelectTemplate} />
                    </div>
                ) : viewMode === 'assistant' ? (
                    <AssistantPanel />
                ) : (
                    <>
                        {/* Active Gem Display */}
                        {activeGem && (
                            <div className="glass p-3 rounded-lg border border-white/10 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-gray-400">Active Agent</div>
                                    <div className={`font-bold ${activeGem.color}`}>{activeGem.name}</div>
                                </div>
                                <div className="text-xs text-gray-500">{activeGem.provider}</div>
                            </div>
                        )}

                        {/* Task Type Selector */}
                        <div className="grid grid-cols-2 gap-3">
                            {taskTypes.map(({ type, icon: Icon, label, description, available }) => (
                                <motion.button
                                    key={type}
                                    whileHover={available ? { scale: 1.02 } : {}}
                                    onClick={() => available && setSelectedTaskType(type)}
                                    disabled={!available}
                                    className={clsx(
                                        'p-4 rounded-xl border text-left transition-all',
                                        selectedTaskType === type && available
                                            ? 'border-neon-purple bg-neon-purple/10'
                                            : available
                                                ? 'border-white/10 bg-white/5 hover:border-white/20'
                                                : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className={clsx('w-5 h-5', selectedTaskType === type ? 'text-neon-purple' : 'text-gray-400')} />
                                        <div className="font-bold text-white text-sm">{label}</div>
                                    </div>
                                    <div className="text-xs text-gray-400">{description}</div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Task Configuration */}
                        <div className="glass p-4 rounded-xl border border-white/10 flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-gray-400">Task Name</label>
                                <input
                                    type="text"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    placeholder="e.g., 'Generate landing page'"
                                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400">Instructions</label>
                                <textarea
                                    value={taskPrompt}
                                    onChange={(e) => setTaskPrompt(e.target.value)}
                                    placeholder="Describe what you want the agent to do..."
                                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hologram-blue outline-none min-h-[120px] resize-none"
                                />
                            </div>

                            <button
                                onClick={handleRunTask}
                                disabled={!activeGem || !taskName.trim() || !taskPrompt.trim() || isRunning}
                                className="w-full px-4 py-3 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
                            >
                                {isRunning ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Run Agent
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Right: Task History */}
            <div className="w-1/2 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-white">Task History</h2>

                <div className="flex-1 overflow-y-auto space-y-3">
                    <AnimatePresence>
                        {agentTasks.length === 0 ? (
                            <div className="glass p-6 rounded-xl border border-white/10 text-center text-gray-400">
                                No tasks yet. Create your first automation above!
                            </div>
                        ) : (
                            agentTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="glass p-4 rounded-xl border border-white/10"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getStatusIcon(task.status)}
                                                <div className="font-bold text-white text-sm">{task.name}</div>
                                            </div>
                                            <div className="text-xs text-gray-400 capitalize">{task.type.replace('-', ' ')}</div>
                                        </div>

                                        {task.status === 'completed' && task.result && (
                                            <button
                                                onClick={() => downloadResult(task)}
                                                className="p-2 bg-hologram-blue/20 text-hologram-blue rounded-lg hover:bg-hologram-blue/30"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {task.status === 'running' && (
                                        <div className="mt-2">
                                            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${task.progress}%` }}
                                                    className="h-full bg-hologram-blue rounded-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {task.error && (
                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                                            {task.error}
                                        </div>
                                    )}

                                    {task.status === 'completed' && task.outputPath && (
                                        <div className="mt-2 text-xs text-green-400">
                                            ✓ Saved to {task.outputPath}
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <LevelUpModal />
        </div>
    );
};
