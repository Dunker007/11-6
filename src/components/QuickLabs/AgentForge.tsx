import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAgentForgeStore } from '../../services/agentforge/agentForgeStore';
import { useActivityStore } from '../../services/activity/activityStore';
import { useLLMStore } from '../../services/ai/llmStore';
import TechIcon from '../Icons/TechIcon';
import { Bot, Plus, Play, Trash2, Terminal, CheckCircle2, XCircle, Loader } from 'lucide-react';
import '../../styles/AgentForge.css';

function AgentForge() {
  const {
    agents,
    templates,
    currentAgent,
    isLoading,
    loadAgents,
    loadTemplates,
    createFromTemplate,
    selectAgent,
    updateAgent,
    deleteAgent,
    runAgent,
  } = useAgentForgeStore();

  const { models } = useLLMStore();
  const { addActivity } = useActivityStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadAgents();
    loadTemplates();
  }, [loadAgents, loadTemplates]);

  const handleCreateFromTemplate = useCallback(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      createFromTemplate(selectedTemplate, {
        name: agentName || undefined,
      });
      addActivity('system', 'created', `Created AI agent "${agentName || template?.name}"`);
      setAgentName('');
      setSelectedTemplate(null);
      setShowCreateDialog(false);
    }
  }, [selectedTemplate, agentName, templates, createFromTemplate, addActivity]);

  const handleShowCreateDialog = useCallback(() => {
    setShowCreateDialog(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setShowCreateDialog(false);
  }, []);

  const handleSelectTemplate = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
  }, []);

  const handleSelectAgent = useCallback((agentId: string) => {
    selectAgent(agentId);
  }, [selectAgent]);

  const handleDeleteAgent = useCallback((agentId: string, agentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAgent(agentId);
    addActivity('system', 'deleted', `Deleted agent "${agentName}"`);
  }, [deleteAgent, addActivity]);

  const handleUpdateAgentName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        config: { ...currentAgent.config, name: e.target.value },
      });
    }
  }, [currentAgent, updateAgent]);

  const handleUpdateAgentProvider = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        config: { ...currentAgent.config, provider: e.target.value as any },
      });
    }
  }, [currentAgent, updateAgent]);

  const handleUpdateAgentModel = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        config: { ...currentAgent.config, model: e.target.value },
      });
    }
  }, [currentAgent, updateAgent]);

  const handleUpdateAgentTemperature = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        config: { ...currentAgent.config, temperature: parseFloat(e.target.value) },
      });
    }
  }, [currentAgent, updateAgent]);

  const handleUpdateAgentSystemPrompt = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        config: { ...currentAgent.config, systemPrompt: e.target.value },
      });
    }
  }, [currentAgent, updateAgent]);

  const handleUpdateAgentDescription = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        config: { ...currentAgent.config, description: e.target.value },
      });
    }
  }, [currentAgent, updateAgent]);

  const handleRunAgent = useCallback(async () => {
    if (!currentAgent) return;
    setIsExecuting(true);
    setExecutionLogs([]);
    addActivity('system', 'started', `Running agent "${currentAgent.config.name}"`);
    try {
      await runAgent(currentAgent.id);
      setExecutionLogs(prev => [...prev, `Agent "${currentAgent.config.name}" executed successfully`]);
      addActivity('system', 'completed', `Agent "${currentAgent.config.name}" completed`);
    } catch (error) {
      setExecutionLogs(prev => [...prev, `Error: ${(error as Error).message}`]);
      addActivity('system', 'error', `Agent "${currentAgent.config.name}" failed`);
    } finally {
      setIsExecuting(false);
    }
  }, [currentAgent, runAgent, addActivity]);

  // Memoize filtered models for current provider
  const availableModels = useMemo(() => {
    if (!currentAgent) return [];
    return models.filter(m => m.provider === currentAgent.config.provider);
  }, [models, currentAgent]);

  return (
    <div className="agent-forge-container">
      <div className="agent-forge-header">
        <h2>Agent Forge</h2>
        <button onClick={handleShowCreateDialog} className="create-btn">
          <TechIcon icon={Plus} size={18} glow="cyan" />
          <span>Create Agent</span>
        </button>
      </div>

      {showCreateDialog && (
        <div className="modal-overlay" onClick={handleCloseCreateDialog}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Agent from Template</h3>
            <div className="templates-grid">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <div className="template-icon">{template.icon}</div>
                  <div className="template-name">{template.name}</div>
                  <div className="template-description">{template.description}</div>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent name (optional)..."
              className="agent-name-input"
            />
            <div className="modal-actions">
              <button onClick={handleCreateFromTemplate} className="confirm-btn" disabled={!selectedTemplate}>
                Create
              </button>
              <button onClick={handleCloseCreateDialog} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="agent-forge-content">
        {agents.length === 0 ? (
          <div className="empty-state">
            <TechIcon icon={Bot} size={64} glow="violet" animated={false} className="empty-icon" />
            <h3>No Agents Created</h3>
            <p>Create your first AI agent to get started</p>
          </div>
        ) : (
          <div className="agents-layout">
            <div className="agents-sidebar">
              <h3>Your Agents</h3>
              <div className="agents-list">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`agent-item ${currentAgent?.id === agent.id ? 'active' : ''}`}
                    onClick={() => handleSelectAgent(agent.id)}
                  >
                    <div className="agent-item-header">
                      <span className="agent-name">{agent.config.name}</span>
                      <button
                        onClick={(e) => handleDeleteAgent(agent.id, agent.config.name, e)}
                        className="delete-agent-btn"
                        title="Delete Agent"
                      >
                        <TechIcon icon={Trash2} size={14} glow="none" />
                      </button>
                    </div>
                    <div className="agent-item-meta">
                      <span className={`status-badge ${agent.status}`}>{agent.status}</span>
                      <span>{agent.usageCount} uses</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {currentAgent && (
              <div className="agent-details">
                <div className="agent-config">
                  <h3>Agent Configuration</h3>
                  <div className="config-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={currentAgent.config.name}
                      onChange={handleUpdateAgentName}
                    />
                  </div>
                  <div className="config-group">
                    <label>Provider</label>
                    <select
                      value={currentAgent.config.provider}
                      onChange={handleUpdateAgentProvider}
                    >
                      <option value="lmstudio">LM Studio</option>
                      <option value="ollama">Ollama</option>
                      <option value="gemini">Gemini ⚡ Recommended</option>
                      <option value="notebooklm">NotebookLM</option>
                    </select>
                    {currentAgent.config.provider === 'gemini' && (
                      <small className="config-hint" style={{ color: 'var(--accent-cyan)' }}>
                        ⚡ Gemini Flash 2.5 is recommended for fast, cost-effective AI agents
                      </small>
                    )}
                  </div>
                  <div className="config-group">
                    <label>Model</label>
                    <select
                      value={currentAgent.config.model}
                      onChange={handleUpdateAgentModel}
                    >
                      {availableModels.map(model => (
                        <option key={model.id} value={model.name}>
                          {model.name} {model.name === 'Gemini Flash 2.5' ? '⚡' : ''}
                        </option>
                      ))}
                      {availableModels.length === 0 && (
                        <option value={currentAgent.config.model}>{currentAgent.config.model || 'No models available'}</option>
                      )}
                    </select>
                    {availableModels.length === 0 && (
                      <small className="config-hint">No models available for this provider. Check LLM Status.</small>
                    )}
                    {currentAgent.config.provider === 'gemini' && (currentAgent.config.model === 'gemini-2.0-flash-exp' || currentAgent.config.model === 'Gemini Flash 2.5') && (
                      <small className="config-hint" style={{ color: 'var(--accent-cyan)' }}>
                        ⚡ Using Gemini Flash 2.5 - Fast and cost-effective
                      </small>
                    )}
                  </div>
                  <div className="config-group">
                    <label>Temperature: {currentAgent.config.temperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentAgent.config.temperature}
                      onChange={handleUpdateAgentTemperature}
                    />
                  </div>
                  {currentAgent.config.systemPrompt && (
                    <div className="config-group">
                      <label>System Prompt</label>
                      <textarea
                        value={currentAgent.config.systemPrompt}
                        onChange={handleUpdateAgentSystemPrompt}
                        rows={4}
                      />
                    </div>
                  )}
                  <div className="config-group">
                    <label>Description</label>
                    <textarea
                      value={currentAgent.config.description || ''}
                      onChange={handleUpdateAgentDescription}
                      placeholder="Agent description..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="agent-actions">
                    <button 
                      onClick={handleRunAgent} 
                      className="run-btn"
                      disabled={isExecuting || isLoading}
                    >
                      {isExecuting || isLoading ? (
                        <>
                          <Loader size={16} className="spinning" />
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <TechIcon icon={Play} size={16} glow="cyan" />
                          <span>Run Agent</span>
                        </>
                      )}
                    </button>
                  </div>

                  {executionLogs.length > 0 && (
                    <div className="execution-logs">
                      <div className="logs-header">
                        <Terminal size={16} />
                        <span>Execution Logs</span>
                      </div>
                      <div className="logs-content">
                        {executionLogs.map((log, idx) => (
                          <div key={idx} className="log-entry">
                            {log.includes('Error') ? (
                              <XCircle size={14} className="log-icon error" />
                            ) : (
                              <CheckCircle2 size={14} className="log-icon success" />
                            )}
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="agent-stats">
                    <div className="stat-item">
                      <span className="stat-label">Status</span>
                      <span className={`stat-value status-${currentAgent.status}`}>
                        {currentAgent.status === 'running' && <Loader size={12} className="spinning" />}
                        {currentAgent.status === 'error' && <XCircle size={12} />}
                        {currentAgent.status === 'idle' && <CheckCircle2 size={12} />}
                        {currentAgent.status}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Usage Count</span>
                      <span className="stat-value">{currentAgent.usageCount}</span>
                    </div>
                    {currentAgent.lastUsed && (
                      <div className="stat-item">
                        <span className="stat-label">Last Used</span>
                        <span className="stat-value">
                          {currentAgent.lastUsed.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentForge;

