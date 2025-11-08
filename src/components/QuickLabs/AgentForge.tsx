import { useState, useEffect } from 'react';
import { useAgentForgeStore } from '../../services/agentforge/agentForgeStore';
import { useActivityStore } from '../../services/activity/activityStore';
import TechIcon from '../Icons/TechIcon';
import { Bot, Plus, Play, Pause, Square, Settings, Cpu, Trash2 } from 'lucide-react';
import '../../styles/AgentForge.css';

function AgentForge() {
  const {
    agents,
    templates,
    currentAgent,
    loadAgents,
    loadTemplates,
    createFromTemplate,
    selectAgent,
    updateAgent,
    deleteAgent,
    runAgent,
  } = useAgentForgeStore();

  const { addActivity } = useActivityStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    loadAgents();
    loadTemplates();
  }, [loadAgents, loadTemplates]);

  const handleCreateFromTemplate = () => {
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
  };

  return (
    <div className="agent-forge-container">
      <div className="agent-forge-header">
        <h2>Agent Forge</h2>
        <button onClick={() => setShowCreateDialog(true)} className="create-btn">
          <TechIcon icon={Plus} size={18} glow="cyan" />
          <span>Create Agent</span>
        </button>
      </div>

      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Agent from Template</h3>
            <div className="templates-grid">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template.id)}
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
              <button onClick={() => setShowCreateDialog(false)} className="cancel-btn">
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
                    onClick={() => selectAgent(agent.id)}
                  >
                    <div className="agent-item-header">
                      <span className="agent-name">{agent.config.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAgent(agent.id);
                          addActivity('system', 'deleted', `Deleted agent "${agent.config.name}"`);
                        }}
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
                      onChange={(e) =>
                        updateAgent(currentAgent.id, {
                          config: { ...currentAgent.config, name: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="config-group">
                    <label>Provider</label>
                    <select
                      value={currentAgent.config.provider}
                      onChange={(e) =>
                        updateAgent(currentAgent.id, {
                          config: { ...currentAgent.config, provider: e.target.value as any },
                        })
                      }
                    >
                      <option value="lmstudio">LM Studio</option>
                      <option value="ollama">Ollama</option>
                      <option value="gemini">Gemini</option>
                      <option value="notebooklm">NotebookLM</option>
                    </select>
                  </div>
                  <div className="config-group">
                    <label>Model</label>
                    <input
                      type="text"
                      value={currentAgent.config.model}
                      onChange={(e) =>
                        updateAgent(currentAgent.id, {
                          config: { ...currentAgent.config, model: e.target.value },
                        })
                      }
                      placeholder="Model name..."
                    />
                  </div>
                  <div className="config-group">
                    <label>Temperature: {currentAgent.config.temperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentAgent.config.temperature}
                      onChange={(e) =>
                        updateAgent(currentAgent.id, {
                          config: { ...currentAgent.config, temperature: parseFloat(e.target.value) },
                        })
                      }
                    />
                  </div>
                  {currentAgent.config.systemPrompt && (
                    <div className="config-group">
                      <label>System Prompt</label>
                      <textarea
                        value={currentAgent.config.systemPrompt}
                        onChange={(e) =>
                          updateAgent(currentAgent.id, {
                            config: { ...currentAgent.config, systemPrompt: e.target.value },
                          })
                        }
                        rows={4}
                      />
                    </div>
                  )}
                  <button onClick={() => {
                    runAgent(currentAgent.id);
                    addActivity('system', 'started', `Running agent "${currentAgent.config.name}"`);
                  }} className="run-btn">
                    <TechIcon icon={Play} size={16} glow="cyan" />
                    <span>Run Agent</span>
                  </button>
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

