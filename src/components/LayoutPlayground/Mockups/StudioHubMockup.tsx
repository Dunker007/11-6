import { useState } from 'react';
import { Code, Folder, GitBranch, Terminal, Activity, MessageSquare, Settings, Zap } from 'lucide-react';
import '../../../styles/LayoutMockups.css';

function StudioHubMockup() {
  const [activeWorkflow, setActiveWorkflow] = useState<'create' | 'build' | 'deploy' | 'monitor' | 'monetize'>('build');
  const [selectedFile, setSelectedFile] = useState('src/App.tsx');

  const workflows = [
    { id: 'create' as const, name: 'Create', icon: Code },
    { id: 'build' as const, name: 'Build', icon: Folder },
    { id: 'deploy' as const, name: 'Deploy', icon: GitBranch },
    { id: 'monitor' as const, name: 'Monitor', icon: Activity },
    { id: 'monetize' as const, name: 'Monetize', icon: Zap },
  ];

  const files = [
    { name: 'src/App.tsx', type: 'file' },
    { name: 'src/components', type: 'folder', expanded: true },
    { name: '  └─ VibeEditor.tsx', type: 'file' },
    { name: '  └─ AIChat.tsx', type: 'file' },
    { name: 'package.json', type: 'file' },
    { name: 'tsconfig.json', type: 'file' },
  ];

  return (
    <div className="mockup-container studio-hub">
      <div className="mockup-top-bar">
        <div className="workflow-switcher">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <button
                key={workflow.id}
                className={`workflow-btn ${activeWorkflow === workflow.id ? 'active' : ''}`}
                onClick={() => setActiveWorkflow(workflow.id)}
              >
                <Icon size={16} />
                <span>{workflow.name}</span>
              </button>
            );
          })}
        </div>
        <div className="top-bar-actions">
          <button className="action-btn">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="mockup-main-layout">
        {/* Left Sidebar */}
        <div className="mockup-sidebar left">
          <div className="sidebar-section">
            <h3>Projects</h3>
            <div className="project-list">
              <div className="project-item active">
                <Folder size={16} />
                <span>my-project</span>
              </div>
              <div className="project-item">
                <Folder size={16} />
                <span>another-project</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Files</h3>
            <div className="file-tree">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className={`file-item ${file.type} ${selectedFile === file.name ? 'active' : ''}`}
                  onClick={() => file.type === 'file' && setSelectedFile(file.name)}
                >
                  {file.name}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button className="quick-action-btn">
                <Zap size={16} />
                <span>New File</span>
              </button>
              <button className="quick-action-btn">
                <Folder size={16} />
                <span>New Folder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Editor */}
        <div className="mockup-center">
          <div className="editor-tabs">
            <div className="editor-tab active">
              <Code size={14} />
              <span>{selectedFile}</span>
              <button className="tab-close">×</button>
            </div>
          </div>
          <div className="code-editor-mockup">
            <div className="editor-line-numbers">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="line-number">{i + 1}</div>
              ))}
            </div>
            <div className="editor-content">
              <div className="code-line">
                <span className="keyword">import</span> <span className="string">'react'</span>;
              </div>
              <div className="code-line">
                <span className="keyword">import</span> <span className="type">VibeEditor</span> <span className="keyword">from</span> <span className="string">'./components/VibeEditor'</span>;
              </div>
              <div className="code-line"></div>
              <div className="code-line">
                <span className="keyword">function</span> <span className="function">App</span>() {'{'}
              </div>
              <div className="code-line">
                {'  '}<span className="keyword">return</span> (
              </div>
              <div className="code-line">
                {'    '}&lt;<span className="tag">VibeEditor</span> /&gt;
              </div>
              <div className="code-line">
                {'  '});
              </div>
              <div className="code-line">
                {'}'}
              </div>
            </div>
          </div>
          <div className="editor-footer">
            <div className="editor-status">
              <span>TypeScript</span>
              <span>•</span>
              <span>UTF-8</span>
              <span>•</span>
              <span>LF</span>
            </div>
            <div className="editor-ai-hint">
              <MessageSquare size={14} />
              <span>AI: Ask me about this file</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="mockup-sidebar right">
          <div className="sidebar-section">
            <h3>
              <MessageSquare size={16} />
              AI Assistant
            </h3>
            <div className="ai-chat-mockup">
              <div className="chat-message user">
                <div className="message-content">Explain this component</div>
              </div>
              <div className="chat-message assistant">
                <div className="message-content">
                  This is the main App component that renders the VibeEditor...
                </div>
              </div>
              <div className="chat-input">
                <input type="text" placeholder="Ask Vibed Ed..." />
                <button>Send</button>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>
              <Activity size={16} />
              Activity Feed
            </h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-time">2m ago</div>
                <div className="activity-text">File saved: App.tsx</div>
              </div>
              <div className="activity-item">
                <div className="activity-time">5m ago</div>
                <div className="activity-text">AI suggestion applied</div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>
              <GitBranch size={16} />
              Git Status
            </h3>
            <div className="git-status-mockup">
              <div className="git-branch">main</div>
              <div className="git-changes">
                <span className="change-added">+3</span>
                <span className="change-modified">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mockup-bottom-bar">
        <div className="terminal-tab active">
          <Terminal size={14} />
          <span>Terminal</span>
        </div>
        <div className="terminal-content">
          <div className="terminal-line">
            <span className="terminal-prompt">$</span> npm run dev
          </div>
          <div className="terminal-line">
            <span className="terminal-output">Vite dev server running on http://localhost:5173</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudioHubMockup;

