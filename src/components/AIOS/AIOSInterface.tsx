import { useState, useEffect } from 'react';
import '../../styles/AIOSInterface.css';

interface AIOSInterfaceProps {
  onExit: () => void;
}

function AIOSInterface({ onExit }: AIOSInterfaceProps) {
  const [activeView, setActiveView] = useState<'home' | 'codebase' | 'flow' | 'collab'>('home');
  const [commandInput, setCommandInput] = useState('');

  // ESC key to exit OS Mode
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onExit]);

  const quickCommands = [
    { icon: '🚀', text: 'Deploy to production with extra monitoring' },
    { icon: '🧪', text: 'Generate full test suite for UserAuth' },
    { icon: '🔍', text: 'Find all security vulnerabilities' },
    { icon: '✨', text: 'Refactor for better performance' },
  ];

  const vibeMetrics = [
    { label: 'Flow Time', value: '4.2h', trend: '+15%', color: 'violet' },
    { label: 'Code Quality', value: '94%', trend: '+8%', color: 'cyan' },
    { label: 'Productivity', value: '3.8x', trend: '+22%', color: 'amber' },
    { label: 'AI Assists', value: '127', trend: '+45%', color: 'green' },
  ];

  const aiWorkspaces = [
    { id: 'fullstack', name: 'Full-Stack Dev', icon: '💻', active: true },
    { id: 'ml', name: 'ML Training', icon: '🤖', active: false },
    { id: 'content', name: 'Content Gen', icon: '✍️', active: false },
  ];

  const collaborators = [
    { name: 'You', status: 'coding', color: '#8b5cf6', avatar: '👨‍💻' },
    { name: 'Sarah', status: 'reviewing', color: '#06b6d4', avatar: '👩‍💻' },
    { name: 'Vibed Ed', status: 'suggesting', color: '#f59e0b', avatar: '🤖' },
  ];

  const errorForecasts = [
    { type: 'Memory Leak', file: 'useEffect hook', severity: 'high', probability: '87%' },
    { type: 'Type Error', file: 'api/routes.ts', severity: 'medium', probability: '65%' },
    { type: 'Perf Bottleneck', file: 'Dashboard.tsx', severity: 'low', probability: '42%' },
  ];

  const securityAlerts = [
    { severity: 'critical', count: 0, label: 'Critical' },
    { severity: 'high', count: 1, label: 'High' },
    { severity: 'medium', count: 3, label: 'Medium' },
    { severity: 'low', count: 7, label: 'Low' },
  ];

  return (
    <div className="ai-os-interface">
      {/* OS Boot Animation - Show briefly on mount */}
      <div className="os-boot-overlay" style={{ animation: 'bootFade 2s ease forwards' }}>
        <div className="boot-logo">
          <div className="holographic-core"></div>
          <h1>DLX OS</h1>
          <p>Initializing AI Systems...</p>
        </div>
      </div>

      {/* Exit Button (top-right) */}
      <button className="os-exit-btn" onClick={onExit} title="Exit OS Mode (ESC)">
        ← Exit to IDE
      </button>

      {/* Top System Bar */}
      <div className="os-system-bar">
        <div className="system-left">
          <div className="os-logo">🌌 DLX OS</div>
          <div className="workspace-switcher">
            {aiWorkspaces.map((ws) => (
              <div key={ws.id} className={`ws-tab ${ws.active ? 'active' : ''}`}>
                <span>{ws.icon}</span>
                <span className="ws-name">{ws.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="system-center">
          {/* Natural Language Command Bar */}
          <div className="nl-command-bar">
            <span className="cmd-icon">✨</span>
            <input
              type="text"
              placeholder="Type anything... 'deploy to prod', 'fix all bugs', 'what's slowing my app'"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="nl-input"
            />
            <span className="cmd-hint">⌘K</span>
          </div>
        </div>
        <div className="system-right">
          {/* Vibe State Indicator */}
          <div className="vibe-state-indicator">
            <div className="vibe-pulse"></div>
            <span>Deep Flow</span>
          </div>
          {/* Notification Center */}
          <div className="notification-center">
            <span className="notif-icon">🔔</span>
            <span className="notif-badge">3</span>
          </div>
        </div>
      </div>

      {/* Main OS Content */}
      <div className="os-main-content">
        {/* Left Sidebar - Quick Actions & Workspaces */}
        <div className="os-sidebar">
          <div className="sidebar-section">
            <h4>Views</h4>
            <div className="view-buttons">
              <button
                className={`view-btn ${activeView === 'home' ? 'active' : ''}`}
                onClick={() => setActiveView('home')}
              >
                <span>🏠</span>
                <span>Home</span>
              </button>
              <button
                className={`view-btn ${activeView === 'codebase' ? 'active' : ''}`}
                onClick={() => setActiveView('codebase')}
              >
                <span>🧠</span>
                <span>Codebase</span>
              </button>
              <button
                className={`view-btn ${activeView === 'flow' ? 'active' : ''}`}
                onClick={() => setActiveView('flow')}
              >
                <span>⚡</span>
                <span>Flow State</span>
              </button>
              <button
                className={`view-btn ${activeView === 'collab' ? 'active' : ''}`}
                onClick={() => setActiveView('collab')}
              >
                <span>👥</span>
                <span>Team</span>
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>AI Agents</h4>
            <div className="agent-list">
              <div className="agent-item active">
                <span className="agent-avatar">🤖</span>
                <div className="agent-info">
                  <div className="agent-name">Vibed Ed</div>
                  <div className="agent-status">Watching for issues</div>
                </div>
              </div>
              <div className="agent-item">
                <span className="agent-avatar">🔍</span>
                <div className="agent-info">
                  <div className="agent-name">Critic Pro</div>
                  <div className="agent-status">Idle</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Content Area */}
        <div className="os-center-content">
          {activeView === 'home' && (
            <div className="home-dashboard">
              <div className="dashboard-greeting">
                <h2>Welcome back! 🚀</h2>
                <p>You're in a <strong>Deep Flow</strong> state. Let's keep the momentum going.</p>
              </div>

              {/* Quick Command Suggestions */}
              <div className="quick-commands">
                <h3>Quick Commands</h3>
                <div className="command-grid">
                  {quickCommands.map((cmd, idx) => (
                    <div key={idx} className="command-card">
                      <span className="cmd-emoji">{cmd.icon}</span>
                      <span className="cmd-text">{cmd.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vibe Metrics */}
              <div className="vibe-metrics-section">
                <h3>Your Vibe Metrics</h3>
                <div className="metrics-grid">
                  {vibeMetrics.map((metric) => (
                    <div key={metric.label} className={`metric-card ${metric.color}`}>
                      <div className="metric-label">{metric.label}</div>
                      <div className="metric-value">{metric.value}</div>
                      <div className="metric-trend">{metric.trend}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Dashboard */}
              <div className="security-dashboard">
                <h3>🛡️ Security Scanner</h3>
                <div className="security-grid">
                  {securityAlerts.map((alert) => (
                    <div key={alert.severity} className={`security-card ${alert.severity}`}>
                      <div className="security-count">{alert.count}</div>
                      <div className="security-label">{alert.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'codebase' && (
            <div className="codebase-view">
              <h2>🧠 Codebase Intelligence</h2>
              <div className="codebase-graph">
                <div className="graph-3d">
                  <div className="graph-node main">App.tsx</div>
                  <div className="graph-node">Components</div>
                  <div className="graph-node">Services</div>
                  <div className="graph-node">Stores</div>
                  <div className="graph-connection"></div>
                  <div className="graph-label">
                    AI is tracking 247 files, 12k LOC, 8 dependencies
                  </div>
                </div>
              </div>

              {/* Error Forecasting */}
              <div className="error-forecasting">
                <h3>⚠️ Error Forecasting</h3>
                <div className="forecast-list">
                  {errorForecasts.map((forecast, idx) => (
                    <div key={idx} className={`forecast-item ${forecast.severity}`}>
                      <div className="forecast-header">
                        <span className="forecast-type">{forecast.type}</span>
                        <span className="forecast-prob">{forecast.probability}</span>
                      </div>
                      <div className="forecast-file">{forecast.file}</div>
                      <button className="forecast-fix-btn">🔧 Auto-Fix</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'flow' && (
            <div className="flow-state-view">
              <h2>⚡ Flow State Manager</h2>
              <div className="flow-stats">
                <div className="flow-timer">
                  <div className="timer-display">04:23:17</div>
                  <div className="timer-label">In Flow State</div>
                </div>
                <div className="flow-chart">
                  <div className="chart-bars">
                    <div className="chart-bar" style={{ height: '60%' }}></div>
                    <div className="chart-bar" style={{ height: '80%' }}></div>
                    <div className="chart-bar" style={{ height: '95%' }}></div>
                    <div className="chart-bar active" style={{ height: '100%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flow-recommendations">
                <h3>AI Recommendations</h3>
                <div className="recommendation">💡 Take a 5-min break in 37 minutes</div>
                <div className="recommendation">🎵 Switch to Lo-Fi ambient for deeper focus</div>
                <div className="recommendation">🚫 Blocking non-essential notifications</div>
              </div>
            </div>
          )}

          {activeView === 'collab' && (
            <div className="collab-view">
              <h2>👥 Team Collaboration</h2>
              <div className="collab-members">
                {collaborators.map((member) => (
                  <div key={member.name} className="member-card">
                    <div className="member-avatar" style={{ borderColor: member.color }}>
                      {member.avatar}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.name}</div>
                      <div className="member-status">{member.status}</div>
                    </div>
                    <div className="member-indicator" style={{ background: member.color }}></div>
                  </div>
                ))}
              </div>

              <div className="smart-review">
                <h3>🔍 Smart Code Review</h3>
                <div className="review-summary">
                  <p>AI analyzed PR #42: "Add user authentication"</p>
                  <ul>
                    <li>✅ Code follows team conventions</li>
                    <li>⚠️ Potential security issue in password hashing</li>
                    <li>💡 Suggests extracting auth logic to service</li>
                  </ul>
                  <button className="review-btn">View Full Analysis</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Context & AI Assistant */}
        <div className="os-right-panel">
          <div className="context-panel">
            <h4>Active Context</h4>
            <div className="context-files">
              <div className="context-file">📝 App.tsx</div>
              <div className="context-file">🎨 themes.ts</div>
              <div className="context-file">⚙️ config.ts</div>
            </div>
          </div>

          <div className="ai-assistant-panel">
            <div className="assistant-header">
              <div className="assistant-avatar">😎</div>
              <div className="assistant-info">
                <div className="assistant-name">Vibed Ed</div>
                <div className="assistant-status">Always watching, bro</div>
              </div>
            </div>
            <div className="assistant-suggestions">
              <div className="suggestion">
                "Yo! That useEffect in VibeEditor looks sus. Want me to refactor it?"
              </div>
              <div className="suggestion-actions">
                <button className="suggest-btn accept">✓ Yes</button>
                <button className="suggest-btn decline">✗ No</button>
              </div>
            </div>
          </div>

          <div className="marketplace-panel">
            <h4>🏪 Extension Store</h4>
            <div className="extension-item">
              <span>🎨</span>
              <div>
                <div>Figma Sync</div>
                <div className="ext-meta">24k installs</div>
              </div>
            </div>
            <div className="extension-item">
              <span>🚀</span>
              <div>
                <div>Deploy Pro</div>
                <div className="ext-meta">18k installs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Labels - Hidden in actual use, shown in demo */}
      <div className="feature-labels" style={{ display: 'none' }}>
        <div className="feature-label" style={{ top: '60px', left: '50%', transform: 'translateX(-50%)' }}>
          <span className="label-tag">Natural Language Everything</span>
          <span className="label-arrow">↓</span>
        </div>
      </div>
    </div>
  );
}

export default AIOSInterface;

