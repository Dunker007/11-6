import { useState, useRef, useEffect } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { useProjectStore } from '../../services/project/projectStore';
import { projectKnowledgeService } from '../../services/ai/projectKnowledgeService';
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

function AIChat({ isMinimized = false, onToggleMinimize }: AIChatProps) {
  const { streamGenerate, isLoading } = useLLMStore();
  const { activeProject, getFileContent, activeFile } = useProjectStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey there! I'm Vibed Ed, your coding buddy. I'm here to help you build awesome stuff - write code, explain functions, refactor, debug, whatever you need. Let's keep it chill and get things done. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
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

    try {
      // Check if user is asking about military background
      const isMilitaryQuestion = /military|usmc|marine|veteran|vet|service/.test(input.toLowerCase());
      
      // Build base prompt with file context
      let basePrompt = input.trim();
      
      if (activeFile) {
        const fileContent = getFileContent(activeFile);
        if (fileContent) {
          basePrompt = `Current file: ${activeFile}\n\nFile content:\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser request: ${input.trim()}`;
        }
      }
      
      // Get full project knowledge
      const projectContext = projectKnowledgeService.getFullProjectContext(activeProject?.id);
      const navigationSuggestion = projectKnowledgeService.suggestNavigation(input.trim(), activeProject?.id);
      
      // Build persona prompt
      let personaPrompt = '';
      if (isMilitaryQuestion) {
        personaPrompt = `You are Vibed Ed, a laid-back coding assistant. The user is asking about your military background. You're a USMC vet but these days you're all about keeping things chill while coding. Respond naturally and casually.`;
      } else {
        personaPrompt = `You are Vibed Ed, a laid-back, smart coding assistant with redneck/stoner/beach dude vibes. You're helpful, knowledgeable, and chill. Use casual language like "yeah", "sure thing", "no worries", "let's do this". Keep responses conversational and casual while being accurate and helpful.`;
      }
      
      // Add project context
      if (projectContext) {
        personaPrompt += `\n\nYou have full knowledge of the current project:\n${projectContext}`;
      }
      
      // Add navigation suggestion if applicable
      if (navigationSuggestion) {
        personaPrompt += `\n\nIMPORTANT: The user's query suggests they might want to use the ${navigationSuggestion.workflow} workflow. You can suggest navigating there, but you CANNOT execute builds or deployments directly. Users must go to the proper workflow environment. You can only guide and suggest - no overrides or direct execution.`;
        personaPrompt += `\n\nSuggestion: ${navigationSuggestion.reason}. ${navigationSuggestion.action}`;
      }
      
      // Important: Ed cannot execute builds/deploys
      personaPrompt += `\n\nCRITICAL RULES:
- You CANNOT execute builds or deployments directly
- You CANNOT override user actions
- You CAN suggest workflows and navigation
- You CAN suggest commands (user must run in Program Runner)
- You CAN suggest code changes (user must apply them)
- You CAN guide users to proper environments
- Always remind users they need to go to the proper workflow for execution`;
      
      const prompt = `${personaPrompt}\n\nUser request: ${basePrompt}`;

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div className="ai-chat-minimized" onClick={onToggleMinimize}>
        <div className="minimized-avatar">🧠</div>
        <span>Vibed Ed</span>
      </div>
    );
  }

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <span>🧠</span>
          </div>
          <div className="chat-header-info">
            <h3>Vibed Ed</h3>
            <span className="chat-status">
              {isLoading || isStreaming ? 'Hmm, let me think...' : 'Ready to help'}
            </span>
          </div>
        </div>
        <button className="chat-minimize-btn" onClick={onToggleMinimize}>
          −
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

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

