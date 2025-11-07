import { useState, useRef, useEffect } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { useProjectStore } from '../../services/project/projectStore';
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
      content: "Hi! I'm VibDee, your AI coding companion. I can help you write code, explain functions, refactor code, and more. What would you like to do?",
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
      // Build context-aware prompt
      let prompt = input.trim();
      
      // Add file context if available
      if (activeFile) {
        const fileContent = getFileContent(activeFile);
        if (fileContent) {
          prompt = `Current file: ${activeFile}\n\nFile content:\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser request: ${input.trim()}`;
        }
      }

      // Add project context
      if (activeProject) {
        prompt = `Project: ${activeProject.name}\n\n${prompt}`;
      }

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
        content: `Error: ${(error as Error).message}. Make sure a local LLM is running (LM Studio or Ollama).`,
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
      explain: 'Explain this code',
      refactor: 'Refactor this code to be more efficient',
      fix: 'Find and fix any bugs in this code',
      test: 'Generate unit tests for this code',
      document: 'Generate JSDoc comments for this code',
    };

    setInput(prompts[action] || action);
    inputRef.current?.focus();
  };

  return (
    <div className="ai-assistant">
      <div className="assistant-header">
        <div className="vibdee-avatar">
          <div className="avatar-glow" />
          <span className="avatar-icon">🧠</span>
        </div>
        <div className="header-info">
          <h3>VibDee</h3>
          <span className="status-indicator">
            {isLoading || isStreaming ? 'Thinking...' : 'Ready'}
          </span>
        </div>
      </div>

      <div className="quick-actions">
        <button
          className="quick-action-btn"
          onClick={() => handleQuickAction('explain')}
          disabled={!activeFile}
        >
          💡 Explain
        </button>
        <button
          className="quick-action-btn"
          onClick={() => handleQuickAction('refactor')}
          disabled={!activeFile}
        >
          🔧 Refactor
        </button>
        <button
          className="quick-action-btn"
          onClick={() => handleQuickAction('fix')}
          disabled={!activeFile}
        >
          🐛 Fix Bugs
        </button>
        <button
          className="quick-action-btn"
          onClick={() => handleQuickAction('test')}
          disabled={!activeFile}
        >
          ✅ Generate Tests
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.role === 'assistant' && (
              <div className="message-avatar">
                <span>🧠</span>
              </div>
            )}
            <div className="message-content">
              <div className="message-text">
                {message.content.split('```').map((part, index) => {
                  if (index % 2 === 1) {
                    // Code block
                    return (
                      <pre key={index} className="code-block">
                        <code>{part}</code>
                      </pre>
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
              <span>🧠</span>
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
          placeholder="Ask VibDee anything... (Shift+Enter for new line)"
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
        >
          {isStreaming ? '⏳' : '🚀'}
        </button>
      </div>
    </div>
  );
}

export default AIAssistant;

