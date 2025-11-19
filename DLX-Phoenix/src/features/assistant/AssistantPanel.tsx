// AssistantPanel.tsx – UI for autonomous assistance & natural language editing
import { useState } from 'react';
import { Loader, Play } from 'lucide-react';
import { runAssistantPrompt, applyNaturalLanguageEdit } from './aiAssistantService';
import { useStore } from '../../vault/Store';

export const AssistantPanel = () => {
    const [prompt, setPrompt] = useState('');
    const [mode, setMode] = useState<'assist' | 'edit'>('assist');
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        if (!prompt.trim()) return;
        setRunning(true);
        setResult(null);
        setError(null);
        try {
            const res = mode === 'assist' ? await runAssistantPrompt(prompt) : await applyNaturalLanguageEdit(prompt);
            if (res.success) {
                setResult(res.output);
            } else {
                setError(res.error || 'Unknown error');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unexpected error');
        } finally {
            setRunning(false);
        }
    };

    const downloadResult = () => {
        if (!result) return;
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assistant_result_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="glass p-4 rounded-xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setMode('assist')}
                    className={`px-3 py-1 rounded ${mode === 'assist' ? 'bg-neon-purple/20 text-neon-purple' : 'bg-white/5 text-gray-300'}`}
                >
                    Assist
                </button>
                <button
                    onClick={() => setMode('edit')}
                    className={`px-3 py-1 rounded ${mode === 'edit' ? 'bg-neon-purple/20 text-neon-purple' : 'bg-white/5 text-gray-300'}`}
                >
                    Edit
                </button>
            </div>
            <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={mode === 'assist' ? 'Describe the task you want the AI to perform...' : 'Describe the code change you want to apply (e.g., rename X to Y)'}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:border-hologram-blue outline-none resize-none"
                disabled={running}
            />
            <button
                onClick={handleRun}
                disabled={running || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {running ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {mode === 'assist' ? 'Run Assistant' : 'Apply Edit'}
            </button>
            {result && (
                <div className="mt-2 p-2 bg-black/30 rounded">
                    <pre className="text-sm whitespace-pre-wrap text-white">{result}</pre>
                    <button
                        onClick={downloadResult}
                        className="mt-2 px-3 py-1 bg-hologram-blue/20 text-hologram-blue rounded hover:bg-hologram-blue/30"
                    >
                        Download Result
                    </button>
                </div>
            )}
            {error && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
};
