import React, { useState, useEffect, useRef } from 'react';
import {
  specialtyAgentService,
  Agent,
  AgentMessage,
  AgentAction,
  AgentSuggestion,
} from '../../services/agents/specialtyAgentService';
import { CyberButton } from '../ui/CyberButton';
import { CyberBadge } from '../ui/CyberBadge';
import { Textarea } from '../ui/Input';
import { Send, Trash2, ArrowLeft, Zap } from 'lucide-react';
import './AgentChat.css';

interface Props {
  agentId?: string;
}

export const AgentChat: React.FC<Props> = ({ agentId: initialAgentId }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    specialtyAgentService.initializeAgents();
    const allAgents = specialtyAgentService.getAllAgents();
    setAgents(allAgents);

    const initialAgent = initialAgentId
      ? allAgents.find(a => a.id === initialAgentId)
      : allAgents[0];

    if (initialAgent) {
      selectAgent(initialAgent);
    }

    const allSuggestions = specialtyAgentService.generateSuggestions();
    setSuggestions(allSuggestions);
  }, [initialAgentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    const conversation = specialtyAgentService.getConversation(agent.id);
    setMessages(conversation?.messages || []);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      await specialtyAgentService.sendMessage(selectedAgent.id, userMessage);
      const conversation = specialtyAgentService.getConversation(selectedAgent.id);
      setMessages(conversation?.messages || []);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExecuteAction = async (action: AgentAction) => {
    if (!selectedAgent) return;

    setIsTyping(true);
    try {
      const result = await specialtyAgentService.executeAction(selectedAgent.id, action.id);

      // Add result as agent message
      const resultMessage: AgentMessage = {
        id: crypto.randomUUID(),
        agentId: selectedAgent.id,
        role: 'agent',
        content: result.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, resultMessage]);
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedAgent) {
    return <div className="loading-state">Loading agents...</div>;
  }

  const agentSuggestions = suggestions.filter(s => s.agentId === selectedAgent.id);

  return (
    <div className="agent-chat-container">
      {/* Agent Sidebar */}
      <div className="agent-sidebar">
        <div className="agent-sidebar-header">
          <h3 className="agent-sidebar-title">🤖 AI Agents</h3>
          <p className="agent-sidebar-subtitle">Choose your assistant</p>
        </div>

        <div className="agent-list">
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => selectAgent(agent)}
              className={`agent-list-item ${selectedAgent.id === agent.id ? 'selected' : ''}`}
            >
              <div className="agent-item-content">
                <span className="agent-avatar">{agent.avatar}</span>
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-role">{agent.role}</div>
                </div>
                <div
                  className={`agent-status-dot ${agent.status === 'available' ? 'available' : 'busy'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-agent-info">
            <span className="chat-agent-avatar">{selectedAgent.avatar}</span>
            <div className="chat-agent-details">
              <h3>{selectedAgent.name}</h3>
              <p>{selectedAgent.description}</p>
            </div>
          </div>
          <CyberButton
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={() => {
              specialtyAgentService.clearConversation(selectedAgent.id);
              setMessages([]);
            }}
          >
            Clear Chat
          </CyberButton>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-avatar">{selectedAgent.avatar}</div>
              <h4>Hi! I'm {selectedAgent.name}</h4>
              <p>{selectedAgent.description}</p>

              <div className="capabilities-list">
                <div className="capabilities-label">I can help you with:</div>
                {selectedAgent.capabilities.slice(0, 4).map((capability, idx) => (
                  <div key={idx} className="capability-item">
                    ✓ {capability}
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`message-row ${message.role}`}
            >
              <div className={`message-bubble ${message.role}`}>
                {message.role === 'agent' && (
                  <div className="message-agent-header">
                    <span className="message-agent-avatar">{selectedAgent.avatar}</span>
                    <span className="message-agent-name">{selectedAgent.name}</span>
                  </div>
                )}

                <div className="message-content">{message.content}</div>

                {message.actions && message.actions.length > 0 && (
                  <div className="message-actions">
                    {message.actions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleExecuteAction(action)}
                        className="action-button"
                      >
                        {action.icon && <span>{action.icon}</span>}
                        <div>
                          <div style={{ fontWeight: 600 }}>{action.label}</div>
                          <div style={{ fontSize: '11px', opacity: 0.8 }}>{action.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <span className="chat-agent-avatar" style={{ fontSize: '20px' }}>{selectedAgent.avatar}</span>
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {agentSuggestions.length > 0 && messages.length === 0 && (
          <div className="suggestions-area">
            <div className="suggestions-title">
              <Zap size={12} style={{ display: 'inline', marginRight: '4px' }} />
              SUGGESTED ACTIONS
            </div>
            <div className="suggestions-list">
              {agentSuggestions.map(suggestion => (
                <CyberBadge
                  key={suggestion.id}
                  label={suggestion.title}
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer hover-lift"
                  // @ts-ignore - onClick not strictly on Badge props but works on span
                  onClick={() => suggestion.action && handleExecuteAction(suggestion.action)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-container">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${selectedAgent.name} anything...`}
              className="chat-input"
              rows={1}
              holographic
            />
            <CyberButton
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              variant="primary"
              rightIcon={<Send size={16} />}
              isLoading={isTyping}
            >
              Send
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgentGrid: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    specialtyAgentService.initializeAgents();
    setAgents(specialtyAgentService.getAllAgents());
  }, []);

  if (selectedAgentId) {
    return (
      <div className="agent-grid-container">
        <CyberButton
          onClick={() => setSelectedAgentId(null)}
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          style={{ marginBottom: '20px' }}
        >
          Back to Agents
        </CyberButton>
        <AgentChat agentId={selectedAgentId} />
      </div>
    );
  }

  return (
    <div className="agent-grid-container">
      <div className="agent-grid-header">
        <h1>🤖 AI Specialty Agents</h1>
        <p>Choose an agent to help you with specific tasks. Each agent is specialized in their area.</p>
      </div>

      <div className="agent-grid">
        {agents.map(agent => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgentId(agent.id)}
            className="agent-card"
          >
            <div className="agent-card-header">
              <span className="agent-card-avatar">{agent.avatar}</span>
              <div className="agent-card-info">
                <h3>{agent.name}</h3>
                <CyberBadge
                  label={agent.role}
                  variant="secondary"
                  size="sm"
                />
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <CyberBadge
                  label={agent.status}
                  variant={agent.status === 'available' ? 'success' : 'warning'}
                  size="sm"
                  glow={agent.status === 'available'}
                />
              </div>
            </div>

            <p className="agent-card-description">
              {agent.description}
            </p>

            <div className="agent-card-capabilities">
              <div className="capabilities-label">Capabilities</div>
              <div className="capabilities-tags">
                {agent.capabilities.slice(0, 3).map((capability, idx) => (
                  <CyberBadge
                    key={idx}
                    label={capability}
                    variant="outline"
                    size="sm"
                  />
                ))}
                {agent.capabilities.length > 3 && (
                  <CyberBadge
                    label={`+${agent.capabilities.length - 3}`}
                    variant="outline"
                    size="sm"
                  />
                )}
              </div>
            </div>

            <CyberButton
              fullWidth
              variant="primary"
              rightIcon={<ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
            >
              Chat with {agent.name.split(' ')[0]}
            </CyberButton>
          </div>
        ))}
      </div>
    </div>
  );
};

