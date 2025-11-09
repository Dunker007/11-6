import { useState, useRef, useEffect } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { useProjectStore } from '../../services/project/projectStore';
import { projectKnowledgeService } from '../../services/ai/projectKnowledgeService';
import TechIcon from '../Icons/TechIcon';
import { Send, Sparkles, Copy, Check, Code } from 'lucide-react';
import '../../styles/AIAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function AIAssistant() {
  const { streamGenerate, isLoading } = useLLMStore();
  const { activeProject, getFileContent, activeFile } = useProjectStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hey there! I'm Vibed Ed, your coding buddy. I'm here to help you build awesome stuff - write code, explain functions, refactor, debug, whatever you need. Let's keep it chill and get things done. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
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
      // Build context-aware prompt with Vibed Ed persona
      let prompt = input.trim();

      // Check if user is asking about military background
      const isMilitaryQuestion =
        /military|usmc|marine|veteran|vet|service/.test(input.toLowerCase());

      // Build base prompt with file context
      let basePrompt = input.trim();

      if (activeFile) {
        const fileContent = getFileContent(activeFile);
        if (fileContent) {
          basePrompt = `Current file: ${activeFile}\n\nFile content:\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser request: ${input.trim()}`;
        }
      }

      // Get full project knowledge
      const projectContext = projectKnowledgeService.getFullProjectContext(
        activeProject?.id
      );
      const navigationSuggestion = projectKnowledgeService.suggestNavigation(
        input.trim(),
        activeProject?.id
      );

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

      prompt = `${personaPrompt}\n\nUser request: ${basePrompt}`;

      // Stream the response
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

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      explain: 'Can you break down what this code does? Keep it simple for me.',
      refactor:
        'This code works but feels messy. Can you clean it up and make it better?',
      fix: "Something's not working right here. Mind taking a look and fixing it?",
      test: 'I need some tests for this. Can you hook me up?',
      document:
        'This could use some comments so I remember what it does later.',
    };

    setInput(prompts[action] || action);
    inputRef.current?.focus();
  };

  const handleCopyCode = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="ai-assistant">
      <div className="assistant-header">
        <div className="vibdee-avatar">
          <TechIcon
            icon={Sparkles}
            size={24}
            glow="violet"
            animated={isStreaming || isLoading}
          />
        </div>
        <div className="header-info">
          <h3>Vibed Ed</h3>
          <span className="status-indicator">
            {isLoading || isStreaming ? 'Thinking...' : 'Ready to help'}
          </span>
        </div>
      </div>

      <div className="quick-actions">
        <button
          className="quick-action-btn"
          onClick={() => handleQuickAction('explain')}
          disabled={!activeFile}
          title="Explain this code"
        >
          <TechIcon icon={Code} size={14} glow="none" />
          <span>Explain</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => handleQuickAction('refactor')}
          disabled={!activeFile}
          title="Suggest improvements"
        >
          <TechIcon icon={Sparkles} size={14} glow="none" />
          <span>Refactor</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => handleQuickAction('fix')}
          disabled={!activeFile}
          title="Find and fix bugs"
        >
          <TechIcon icon={Code} size={14} glow="none" />
          <span>Fix</span>
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.role === 'assistant' && (
              <div className="message-avatar">
                <TechIcon icon={Sparkles} size={20} glow="violet" />
              </div>
            )}
            <div className="message-content">
              <div className="message-text">
                {message.content.split('```').map((part, index) => {
                  if (index % 2 === 1) {
                    // Code block
                    return (
                      <div key={index} className="code-block-wrapper">
                        <div className="code-block-header">
                          <TechIcon icon={Code} size={14} glow="none" />
                          <button
                            className="copy-code-btn"
                            onClick={() => handleCopyCode(message.id, part)}
                          >
                            <TechIcon
                              icon={
                                copiedMessageId === message.id ? Check : Copy
                              }
                              size={14}
                              glow={
                                copiedMessageId === message.id ? 'cyan' : 'none'
                              }
                            />
                          </button>
                        </div>
                        <pre className="code-block">
                          <code>{part}</code>
                        </pre>
                      </div>
                    );
                  }
                  return <span key={index}>{part}</span>;
                })}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="message assistant">
            <div className="message-avatar">
              <TechIcon
                icon={Sparkles}
                size={20}
                glow="violet"
                animated={true}
              />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          ref={inputRef}
          className="message-input"
          placeholder="Ask Vibed Ed anything... (Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={3}
          disabled={isLoading || isStreaming}
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={!input.trim() || isLoading || isStreaming}
          title="Send message"
        >
          <TechIcon
            icon={Send}
            size={18}
            glow={input.trim() && !isLoading && !isStreaming ? 'cyan' : 'none'}
            animated={isStreaming || isLoading}
          />
        </button>
      </div>
    </div>
  );
}

export default AIAssistant;
