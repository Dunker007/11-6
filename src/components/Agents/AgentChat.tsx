import React, { useState, useEffect, useRef } from 'react';
import {
  specialtyAgentService,
  Agent,
  AgentMessage,
  AgentAction,
  AgentSuggestion,
} from '../../services/agents/specialtyAgentService';

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
      const response = await specialtyAgentService.sendMessage(selectedAgent.id, userMessage);
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

  const handleQuickAction = (suggestion: AgentSuggestion) => {
    const agent = agents.find(a => a.id === suggestion.agentId);
    if (agent) {
      selectAgent(agent);
      if (suggestion.action) {
        handleExecuteAction(suggestion.action);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedAgent) {
    return <div>Loading agents...</div>;
  }

  const agentSuggestions = suggestions.filter(s => s.agentId === selectedAgent.id);

  return (
    <div style={{ display: 'flex', height: '100%', maxHeight: '800px', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
      {/* Agent Sidebar */}
      <div style={{ width: '280px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>🤖 AI Agents</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Choose your assistant</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => selectAgent(agent)}
              style={{
                padding: '15px',
                cursor: 'pointer',
                background: selectedAgent.id === agent.id ? '#eff6ff' : 'white',
                borderLeft: selectedAgent.id === agent.id ? '3px solid #3b82f6' : '3px solid transparent',
                borderBottom: '1px solid #f3f4f6',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedAgent.id !== agent.id) {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAgent.id !== agent.id) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span style={{ fontSize: '24px' }}>{agent.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{agent.role}</div>
                </div>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: agent.status === 'available' ? '#10b981' : '#6b7280',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>{selectedAgent.avatar}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 3px 0', fontSize: '18px', fontWeight: 'bold' }}>{selectedAgent.name}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{selectedAgent.description}</p>
            </div>
            <button
              onClick={() => {
                specialtyAgentService.clearConversation(selectedAgent.id);
                setMessages([]);
              }}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              🗑️ Clear Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fafafa' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>{selectedAgent.avatar}</div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                Hi! I'm {selectedAgent.name}
              </h4>
              <p style={{ color: '#6b7280', marginBottom: '25px', maxWidth: '400px', margin: '0 auto' }}>
                {selectedAgent.description}
              </p>

              <div style={{ marginTop: '25px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  I can help you with:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '500px', margin: '0 auto' }}>
                  {selectedAgent.capabilities.slice(0, 4).map((capability, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        textAlign: 'left',
                      }}
                    >
                      ✓ {capability}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              style={{
                marginBottom: '15px',
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: message.role === 'user' ? '#3b82f6' : 'white',
                  color: message.role === 'user' ? 'white' : '#374151',
                  border: message.role === 'agent' ? '1px solid #e5e7eb' : 'none',
                  boxShadow: message.role === 'agent' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {message.role === 'agent' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{selectedAgent.avatar}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                      {selectedAgent.name}
                    </span>
                  </div>
                )}

                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{message.content}</div>

                {message.actions && message.actions.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {message.actions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleExecuteAction(action)}
                        style={{
                          padding: '10px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {action.icon && <span>{action.icon}</span>}
                        <div>
                          <div>{action.label}</div>
                          <div style={{ fontSize: '11px', opacity: 0.9 }}>{action.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px' }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
              <span style={{ fontSize: '20px' }}>{selectedAgent.avatar}</span>
              <div style={{ padding: '10px 16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'pulse 1.5s ease-in-out 0.4s infinite' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {agentSuggestions.length > 0 && messages.length === 0 && (
          <div style={{ padding: '15px 20px', borderTop: '1px solid #e5e7eb', background: '#fffbeb' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#92400e' }}>
              💡 Suggested Actions:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {agentSuggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => suggestion.action && handleExecuteAction(suggestion.action)}
                  style={{
                    padding: '8px 14px',
                    background: 'white',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#92400e',
                    fontWeight: '500',
                  }}
                >
                  {suggestion.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${selectedAgent.name} anything...`}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
                minHeight: '48px',
                maxHeight: '120px',
                fontFamily: 'inherit',
              }}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              style={{
                padding: '12px 24px',
                background: inputMessage.trim() && !isTyping ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: inputMessage.trim() && !isTyping ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                height: '48px',
              }}
            >
              Send
            </button>
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
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <button
          onClick={() => setSelectedAgentId(null)}
          style={{
            padding: '10px 20px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '20px',
            fontWeight: '500',
          }}
        >
          ← Back to Agents
        </button>
        <AgentChat agentId={selectedAgentId} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>🤖 AI Specialty Agents</h1>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Choose an agent to help you with specific tasks. Each agent is specialized in their area.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {agents.map(agent => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgentId(agent.id)}
            style={{
              padding: '25px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <span style={{ fontSize: '40px' }}>{agent.avatar}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 3px 0', fontSize: '18px', fontWeight: 'bold' }}>{agent.name}</h3>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{agent.role}</div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  background: agent.status === 'available' ? '#10b981' : '#6b7280',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              >
                {agent.status.toUpperCase()}
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 15px 0', lineHeight: '1.5' }}>
              {agent.description}
            </p>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                Capabilities:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {agent.capabilities.slice(0, 3).map((capability, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      background: '#eff6ff',
                      color: '#1e40af',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                  >
                    {capability}
                  </div>
                ))}
                {agent.capabilities.length > 3 && (
                  <div
                    style={{
                      padding: '4px 10px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                  >
                    +{agent.capabilities.length - 3} more
                  </div>
                )}
              </div>
            </div>

            <button
              style={{
                width: '100%',
                padding: '10px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Chat with {agent.name.split(' ')[0]} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
