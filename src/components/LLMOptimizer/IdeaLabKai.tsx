// src/components/LLMOptimizer/IdeaLabKai.tsx
import { useState, useRef, useEffect } from 'react';
import { useLLMStore } from '@/services/ai/llmStore';
import type { Idea } from '@/services/idea/ideaInventoryService';
import { Send, Lightbulb, Plus, Sparkles } from 'lucide-react';
import '../../styles/LLMOptimizer.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  idea?: Idea;
}

interface IdeaLabKaiProps {
  onIdeaSuggest?: (idea: Omit<Idea, 'id' | 'status' | 'created'>) => void;
}

const KAI_PERSONA = `You are Kai, The Strategist - a creative partner for brainstorming new ideas and passive income streams. You're enthusiastic, creative, and always thinking about opportunities. You help users:
- Brainstorm new project ideas
- Structure and refine ideas
- Plan project strategies
- Model revenue potential
- Suggest improvements to existing ideas

Keep responses conversational, creative, and actionable. When you suggest an idea, format it clearly so it can be added to the idea inventory.`;

function IdeaLabKai({ onIdeaSuggest }: IdeaLabKaiProps) {
  const { streamGenerate, isLoading } = useLLMStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! I'm Kai, your creative strategist. What ideas are we exploring today? I can help you brainstorm, structure ideas, or plan projects.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const prompt = `${KAI_PERSONA}\n\nUser: ${input.trim()}\n\nKai:`;
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let fullContent = '';
      for await (const chunk of streamGenerate(prompt)) {
        if (chunk.text) {
          fullContent += chunk.text;
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = fullContent;
            }
            return updated;
          });
        }
      }

      // Try to extract idea suggestions from the response
      const ideaMatch = fullContent.match(/idea[:\s]+(.+?)(?:\.|$)/i);
      if (ideaMatch && onIdeaSuggest) {
        // This is a simple extraction - could be enhanced
        const ideaTitle = ideaMatch[1].trim();
        if (ideaTitle.length > 3 && ideaTitle.length < 100) {
          // Could parse more details from the response
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hmm, ran into an issue: ${(error as Error).message}. Make sure you've got a local LLM running (LM Studio or Ollama) or an API key configured.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleQuickAction = (action: 'capture' | 'structure' | 'plan') => {
    const prompts: Record<string, string> = {
      capture: 'I have a quick idea I want to capture. Help me structure it.',
      structure: 'I have an idea but need help structuring it better. Can you help?',
      plan: 'I want to create a project plan for one of my ideas. Can you guide me?',
    };

    setInput(prompts[action]);
  };

  const handleAddIdea = () => {
    // Quick idea capture
    const ideaTitle = prompt('Enter idea title:');
    if (ideaTitle && onIdeaSuggest) {
      onIdeaSuggest({
        title: ideaTitle,
        topic: 'General',
        description: prompt('Enter description:') || '',
        source: 'Kai Suggestion',
      });
    }
  };

  return (
    <div className="ideaLab-kai-panel">
      <div className="kai-panel-header">
        <div className="kai-header-title">
          <Sparkles size={20} />
          <h3>Kai, The Strategist</h3>
        </div>
        <button className="quick-add-btn" onClick={handleAddIdea} title="Quick Add Idea">
          <Plus size={16} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="kai-quick-actions">
        <button className="quick-action-btn" onClick={() => handleQuickAction('capture')}>
          <Lightbulb size={14} />
          <span>Capture Idea</span>
        </button>
        <button className="quick-action-btn" onClick={() => handleQuickAction('structure')}>
          <Sparkles size={14} />
          <span>Structure</span>
        </button>
        <button className="quick-action-btn" onClick={() => handleQuickAction('plan')}>
          <Plus size={14} />
          <span>Plan</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="kai-chat-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`kai-message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
            {msg.idea && (
              <div className="idea-suggestion-card">
                <h5>{msg.idea.title}</h5>
                <p>{msg.idea.description}</p>
                <button
                  className="add-idea-btn"
                  onClick={() => onIdeaSuggest?.(msg.idea!)}
                >
                  Add to Ideas
                </button>
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="kai-message assistant">
            <div className="message-content">
              <span className="typing-indicator">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="kai-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Chat with Kai..."
          disabled={isLoading || isStreaming}
          className="kai-input"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || isStreaming}
          className="kai-send-btn"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export default IdeaLabKai;

