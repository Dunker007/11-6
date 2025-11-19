/**
 * AI Assistant
 * Conversational AI for revenue insights and guidance
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, TrendingUp, DollarSign, Lightbulb } from 'lucide-react';
import { useAIStore } from '../../services/ai/ai-router';
import type { AIMessage } from '../../types/ai';
import { useRevenueStore, formatCurrency } from '../../services/revenue/revenue-engine';
import { useAnalyticsStore } from '../../services/revenue/analytics';
import { toast } from '../ui/Toast';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: 'Analyze my revenue trends', prompt: 'Analyze my current revenue trends and tell me what patterns you see.' },
  { icon: DollarSign, text: 'How can I increase revenue?', prompt: 'Based on my current revenue streams, what are the top 3 ways I can increase my income?' },
  { icon: Lightbulb, text: 'Suggest new opportunities', prompt: 'What new revenue opportunities should I explore based on my current setup?' },
];

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { activeProvider, activeModel, generate } = useAIStore();
  const { stats, streams, opportunities } = useRevenueStore();
  const { insights, sourceMetrics } = useAnalyticsStore();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `👋 Hi! I'm your AI revenue assistant. I can help you understand your revenue, identify opportunities, and optimize your income streams.\n\nWhat would you like to know?`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = (): string => {
    const context = {
      totalRevenue: stats ? formatCurrency(stats.total) : '$0',
      activeStreams: streams.length,
      sources: sourceMetrics.map(s => ({
        source: s.source,
        total: formatCurrency(s.total),
        percentage: s.percentage.toFixed(0) + '%',
      })),
      insights: insights.slice(0, 3),
      opportunities: opportunities.slice(0, 3).map(o => ({
        title: o.title,
        estimatedRevenue: formatCurrency(o.estimatedRevenue),
      })),
      trend: stats?.trend || 'stable',
      change: stats?.change || 0,
    };

    return `
Revenue Context:
- Total Revenue: ${context.totalRevenue}
- Active Streams: ${context.activeStreams}
- Top Sources: ${context.sources.map(s => `${s.source} (${s.total}, ${s.percentage})`).join(', ')}
- Trend: ${context.trend} (${context.change > 0 ? '+' : ''}${context.change.toFixed(1)}% this month)
${context.insights.length > 0 ? `\nCurrent Insights:\n${context.insights.map(i => `- ${i}`).join('\n')}` : ''}
${context.opportunities.length > 0 ? `\nTop Opportunities:\n${context.opportunities.map(o => `- ${o.title} (+${o.estimatedRevenue}/mo)`).join('\n')}` : ''}
`.trim();
  };

  const handleSend = async (promptText?: string) => {
    const messageText = promptText || input.trim();
    if (!messageText || isGenerating) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      const systemContext = buildContext();
      const aiMessages: AIMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: `You are a revenue optimization AI assistant. Help the user with their revenue-related questions.

${systemContext}

User Question: ${messageText}

Provide a helpful, concise response focusing on actionable insights.`,
          timestamp: new Date(),
        },
      ];

      const response = await generate(aiMessages, {
        temperature: 0.7,
        maxTokens: 512,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('AI Assistant Error', {
        description: 'Failed to generate response. Please try again.',
      });
      console.error('AI Assistant error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl h-[80vh] bg-cyber-darker border border-cyber-primary/30 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cyber-primary/20 bg-cyber-dark/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-primary/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-cyber-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold gradient-text">AI Revenue Assistant</h2>
                <p className="text-xs text-gray-400">
                  Powered by {activeProvider === 'gemini' ? 'Gemini 2.0' : activeProvider === 'claude' ? 'Claude 3.5' : activeModel}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyber-dark rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-cyber-primary/20 border border-cyber-primary/30'
                      : 'bg-cyber-dark border border-cyber-primary/10'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}

            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-cyber-dark border border-cyber-primary/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-cyber-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-cyber-primary/10">
              <div className="text-xs text-gray-400 mb-2">Quick questions:</div>
              <div className="flex gap-2 flex-wrap">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-2 bg-cyber-dark border border-cyber-primary/20 rounded-lg hover:border-cyber-primary/40 transition-colors text-sm disabled:opacity-50"
                  >
                    <prompt.icon className="w-4 h-4 text-cyber-primary" />
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-cyber-primary/20 bg-cyber-dark/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your revenue..."
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="px-4 py-2 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
