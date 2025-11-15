import { useState } from 'react';
import { MessageSquare, Code, FileText, Zap, Brain, Shield, Bot, Sparkles } from 'lucide-react';
import '../../../styles/LayoutMockups.css';

function BoltAIWorkspaceMockup() {
  const [showContext, setShowContext] = useState(true);
  const [showTurboEdit, setShowTurboEdit] = useState(false);

  const aiAgents = [
    { id: 'kai', name: 'Kai', status: 'active', role: 'Creative Brainstorming' },
    { id: 'guardian', name: 'Guardian', status: 'active', role: 'System Health' },
    { id: 'bytebot', name: 'ByteBot', status: 'idle', role: 'Task Automation' },
  ];

  const contextFiles = [
    { name: 'src/App.tsx', lines: 245, relevance: 95 },
    { name: 'src/components/VibeEditor.tsx', lines: 180, relevance: 88 },
    { name: 'src/services/ai/aiServiceBridge.ts', lines: 320, relevance: 92 },
  ];

  return (
    <div className="mockup-container bolt-ai-workspace">
      {/* AI Chat Primary Surface */}
      <div className="mockup-main-layout bolt-layout">
        <div className="bolt-chat-section">
          <div className="chat-header">
            <div className="chat-title">
              <Sparkles size={20} />
              <span>Vibed Ed - AI Coding Assistant</span>
            </div>
            <div className="chat-actions">
              <button className="action-btn" onClick={() => setShowContext(!showContext)}>
                <Brain size={16} />
                <span>Context</span>
              </button>
              <button className="action-btn" onClick={() => setShowTurboEdit(!showTurboEdit)}>
                <Zap size={16} />
                <span>Turbo Edit</span>
              </button>
            </div>
          </div>

          <div className="chat-messages">
            <div className="message user">
              <div className="message-avatar">U</div>
              <div className="message-content">
                <div className="message-text">
                  Can you refactor the VibeEditor component to use React hooks instead of class components?
                </div>
                <div className="message-time">2:34 PM</div>
              </div>
            </div>

            <div className="message assistant">
              <div className="message-avatar">AI</div>
              <div className="message-content">
                <div className="message-text">
                  I'll help you refactor VibeEditor to use React hooks. Let me analyze the current implementation and create a modernized version.
                </div>
                <div className="code-preview">
                  <div className="code-header">
                    <FileText size={14} />
                    <span>src/components/VibeEditor.tsx</span>
                  </div>
                  <div className="code-content">
                    <div className="code-line">
                      <span className="keyword">import</span> <span className="string">{'{'}</span> <span className="type">useState</span>, <span className="type">useEffect</span> <span className="string">{'}'}</span> <span className="keyword">from</span> <span className="string">'react'</span>;
                    </div>
                    <div className="code-line"></div>
                    <div className="code-line">
                      <span className="keyword">function</span> <span className="function">VibeEditor</span>() {'{'}
                    </div>
                    <div className="code-line">
                      {'  '}<span className="keyword">const</span> [<span className="variable">files</span>, <span className="function">setFiles</span>] = <span className="function">useState</span>([]);
                    </div>
                    <div className="code-line">
                      {'  '}<span className="comment">// ... rest of component</span>
                    </div>
                    <div className="code-line">
                      {'}'}
                    </div>
                  </div>
                </div>
                <div className="message-actions">
                  <button className="action-btn-small">
                    <Zap size={14} />
                    Apply Changes
                  </button>
                  <button className="action-btn-small">
                    <Code size={14} />
                    View Diff
                  </button>
                </div>
                <div className="message-time">2:35 PM</div>
              </div>
            </div>
          </div>

          <div className="chat-input-area">
            <div className="input-actions">
              <button className="quick-action">
                <Zap size={14} />
                Turbo Edit
              </button>
              <button className="quick-action">
                <Code size={14} />
                Explain Code
              </button>
              <button className="quick-action">
                <Shield size={14} />
                Security Review
              </button>
            </div>
            <div className="chat-input-wrapper">
              <textarea
                className="chat-input"
                placeholder="Ask Vibed Ed anything... (Ctrl+Shift+E for Turbo Edit)"
                rows={3}
              />
              <button className="send-btn">
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Context HUD */}
        {showContext && (
          <div className="bolt-context-hud">
            <div className="context-header">
              <Brain size={16} />
              <span>Project Context</span>
            </div>
            <div className="context-stats">
              <div className="stat-item">
                <div className="stat-value">12</div>
                <div className="stat-label">Files Analyzed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">2,450</div>
                <div className="stat-label">Lines Analyzed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">95%</div>
                <div className="stat-label">Relevance</div>
              </div>
            </div>
            <div className="context-files">
              <div className="context-files-header">Related Files</div>
              {contextFiles.map((file, idx) => (
                <div key={idx} className="context-file-item">
                  <FileText size={12} />
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {file.lines} lines • {file.relevance}% relevant
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Turbo Edit Panel */}
        {showTurboEdit && (
          <div className="bolt-turbo-edit-panel">
            <div className="turbo-header">
              <Zap size={16} />
              <span>Turbo Edit</span>
              <button className="close-btn" onClick={() => setShowTurboEdit(false)}>×</button>
            </div>
            <div className="turbo-content">
              <div className="turbo-input">
                <textarea
                  placeholder="Describe the changes you want to make..."
                  rows={4}
                />
              </div>
              <div className="turbo-preview">
                <div className="diff-preview">
                  <div className="diff-line added">
                    <span className="diff-marker">+</span>
                    <span className="diff-content">const [files, setFiles] = useState([]);</span>
                  </div>
                  <div className="diff-line removed">
                    <span className="diff-marker">-</span>
                    <span className="diff-content">this.state = {'{'} files: [] {'}'};</span>
                  </div>
                </div>
              </div>
              <button className="turbo-apply-btn">
                <Zap size={16} />
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Agents Status */}
      <div className="bolt-agents-bar">
        <div className="agents-title">AI Agents</div>
        <div className="agents-list">
          {aiAgents.map((agent) => (
            <div key={agent.id} className={`agent-item ${agent.status}`}>
              <Bot size={14} />
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-role">{agent.role}</div>
              </div>
              <div className={`agent-status ${agent.status}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BoltAIWorkspaceMockup;

