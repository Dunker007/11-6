import { useState, useRef, useEffect } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import { projectKnowledgeService } from '../../services/ai/projectKnowledgeService';
import { aiServiceBridge } from '../../services/ai/aiServiceBridge';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import { VIBED_ED_PERSONAS, VibedEdPersona } from '../../services/ai/prompts/vibedEdPersonas';
import '../../styles/AIChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface StructuredIdea {
  title: string;
  summary: string;
}

function AIChat({ isMinimized = false, onToggleMinimize }: AIChatProps) {
  const { streamGenerate, isLoading } = useLLMStore();
  const { activeProject, getFileContent, activeFile, createProject } = useProjectStore();
  const { addActivity } = useActivityStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey there! I'm Vibed Ed. What's the vibe today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [activePersona, setActivePersona] = useState<VibedEdPersona>('strategic');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showContextHUD, setShowContextHUD] = useState(false);
  const [currentContext, setCurrentContext] = useState<string | null>(null);
  const [ideaModalState, setIdeaModalState] = useState<{ isOpen: boolean; idea: StructuredIdea | null }>({ isOpen: false, idea: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    
    // Track user query
    const shortQuery = input.trim().slice(0, 50) + (input.trim().length > 50 ? '...' : '');
    addActivity('ai', 'query', `Asked: "${shortQuery}"`);

    try {
      // Get full project knowledge
      const projectContext = projectKnowledgeService.getFullProjectContext(activeProject?.id);
      setCurrentContext(projectContext); // Store context for the HUD
      
      // Get persona prompt from the active persona
      let personaPrompt = VIBED_ED_PERSONAS[activePersona].prompt;
      
      // Add project context
      if (projectContext) {
        personaPrompt += `\n\nYou have full knowledge of the current project:\n${projectContext}`;
      }
      
      const prompt = `${personaPrompt}\n\nUser request: ${input.trim()}`;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let fullContent = '';
      for await (const chunk of streamGenerate(prompt)) {
        fullContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = fullContent;
          }
          return updated;
        });
      }
      
      // Track AI response completion
      addActivity('ai', 'response', 'Vibed Ed responded');
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Ah, ran into an issue there: ${(error as Error).message}. Make sure you've got a local LLM running (LM Studio or Ollama) or an API key configured. No worries though, we'll get it sorted.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAddToIdeas = async (messageContent: string) => {
    try {
      const structuredIdea = await aiServiceBridge.structureIdea(messageContent);
      setIdeaModalState({ isOpen: true, idea: structuredIdea });
    } catch (error) {
      console.error("Failed to structure idea:", error);
      // Fallback for non-electron or if LLM fails
      setIdeaModalState({ 
        isOpen: true, 
        idea: { title: messageContent.substring(0, 50) + '...', summary: messageContent }
      });
    }
  };

  const confirmAddToIdeas = () => {
    if (ideaModalState.idea) {
      createProject(ideaModalState.idea.title, ideaModalState.idea.summary);
      addActivity('ai', 'idea', `New idea created: "${ideaModalState.idea.title}"`);
    }
    setIdeaModalState({ isOpen: false, idea: null });
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div className="ai-chat-minimized" onClick={onToggleMinimize}>
        <TechIcon 
          icon={ICON_MAP.vibedEd}
          size={24}
          glow="violet"
          animated={true}
          className="minimized-avatar"
        />
        <span>Vibed Ed</span>
      </div>
    );
  }

  return (
    <div className="ai-chat glass-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <TechIcon 
              icon={ICON_MAP.vibedEd}
              size={24}
              glow="violet"
              animated={isLoading || isStreaming}
            />
          </div>
          <div className="chat-header-info">
            <h3>Vibed Ed</h3>
            <span className="chat-status">
              {isLoading || isStreaming ? 'Thinking...' : 'Ready to help'}
            </span>
          </div>
        </div>
        <div className="chat-header-right">
          <button className="context-hud-btn" onClick={() => setShowContextHUD(!showContextHUD)} title="View Context">
            <TechIcon icon={ICON_MAP.codereview} size={16} />
          </button>
          <select 
            className="vibe-selector" 
            value={activePersona} 
            onChange={(e) => setActivePersona(e.target.value as VibedEdPersona)}
          >
            {Object.entries(VIBED_ED_PERSONAS).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
          <button className="chat-minimize-btn" onClick={onToggleMinimize}>
            −
          </button>
        </div>
      </div>

      {showContextHUD && (
        <div className="context-hud">
          <h4>AI Context</h4>
          <pre>{currentContext || 'No context available.'}</pre>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className="message-content">{message.content}</div>
            {message.role === 'assistant' && (
              <button 
                className="add-to-ideas-btn" 
                onClick={() => handleAddToIdeas(message.content)}
                title="Add to Idea Pipeline"
              >
                <TechIcon icon={ICON_MAP.plus} size="sm" />
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {ideaModalState.isOpen && ideaModalState.idea && (
        <div className="modal-overlay" onClick={() => setIdeaModalState({ isOpen: false, idea: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm New Idea</h3>
            </div>
            <div className="modal-body">
              <p>Ed drafted this for your Idea Pipeline. Look good?</p>
              <input 
                type="text" 
                className="modal-input"
                value={ideaModalState.idea.title}
                onChange={(e) => setIdeaModalState(prev => ({...prev, idea: {...prev.idea!, title: e.target.value}}))}
              />
              <textarea 
                className="modal-input"
                rows={4}
                value={ideaModalState.idea.summary}
                onChange={(e) => setIdeaModalState(prev => ({...prev, idea: {...prev.idea!, summary: e.target.value}}))}
              />
            </div>
            <div className="modal-footer">
              <button className="modal-button-secondary" onClick={() => setIdeaModalState({ isOpen: false, idea: null })}>Cancel</button>
              <button className="modal-button-primary" onClick={confirmAddToIdeas}>Add to Ideas</button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Ask Vibed Ed anything... (Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={2}
          disabled={isLoading || isStreaming}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading || isStreaming}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default AIChat;

