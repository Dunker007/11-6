import { useState } from 'react';

interface AppWindow {
  id: string;
  name: string;
  icon: string;
  color: string;
  minimized: boolean;
  position: { x: number; y: number };
}

function DesktopExperienceMockup() {
  const [openWindows, setOpenWindows] = useState<AppWindow[]>([
    {
      id: 'multifile',
      name: 'Multi-File Editor',
      icon: '📝',
      color: 'violet',
      minimized: false,
      position: { x: 100, y: 80 },
    },
  ]);
  const [hybridMode, setHybridMode] = useState<'ai' | 'deep'>('ai');
  const [moodEnvironment, setMoodEnvironment] = useState('focus');

  const dockApps = [
    { id: 'create', name: 'Create', icon: '⚡', color: 'violet' },
    { id: 'build', name: 'Build', icon: '🔨', color: 'cyan' },
    { id: 'deploy', name: 'Deploy', icon: '🚀', color: 'amber' },
    { id: 'vibestudio', name: 'Vibe Studio', icon: '✨', color: 'gradient' },
    { id: 'multifile', name: 'Multi-File Editor', icon: '📝', color: 'violet' },
    { id: 'critic', name: 'Critic Agent', icon: '🔍', color: 'cyan' },
    { id: 'testgen', name: 'Test Generator', icon: '🧪', color: 'green' },
    { id: 'debugger', name: 'Smart Debugger', icon: '🐛', color: 'amber' },
  ];

  const moods = [
    { id: 'focus', name: 'Deep Focus', icon: '🎯', theme: 'dark' },
    { id: 'creative', name: 'Creative', icon: '🎨', theme: 'colorful' },
    { id: 'chill', name: 'Chill Coding', icon: '🌊', theme: 'zen' },
  ];

  const handleLaunchApp = (appId: string) => {
    if (openWindows.find((w) => w.id === appId)) {
      // Window exists, bring to front or unminimize
      setOpenWindows((windows) =>
        windows.map((w) => (w.id === appId ? { ...w, minimized: false } : w))
      );
      return;
    }

    const app = dockApps.find((a) => a.id === appId);
    if (!app) return;

    const newWindow: AppWindow = {
      id: appId,
      name: app.name,
      icon: app.icon,
      color: app.color,
      minimized: false,
      position: { x: 50 + openWindows.length * 30, y: 50 + openWindows.length * 30 },
    };

    setOpenWindows([...openWindows, newWindow]);
  };

  const handleMinimize = (appId: string) => {
    setOpenWindows((windows) =>
      windows.map((w) => (w.id === appId ? { ...w, minimized: true } : w))
    );
  };

  const handleClose = (appId: string) => {
    setOpenWindows((windows) => windows.filter((w) => w.id !== appId));
  };

  const renderWindowContent = (window: AppWindow) => {
    switch (window.id) {
      case 'multifile':
        return (
          <div className="window-content-demo">
            <div className="multifile-demo">
              <div className="file-tabs">
                <div className="file-tab active">App.tsx</div>
                <div className="file-tab">VibeEditor.tsx</div>
                <div className="file-tab">themeService.ts</div>
              </div>
              <div className="ai-edits-indicator">
                <span>🤖 AI is editing 3 files simultaneously...</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'critic':
        return (
          <div className="window-content-demo">
            <div className="critic-demo">
              <div className="critic-status">
                <span className="status-icon">✅</span>
                <span>Real-time code review: 3 suggestions</span>
              </div>
              <div className="critic-items">
                <div className="critic-item">
                  <span className="severity info">ℹ️ INFO</span>
                  <span>Consider extracting this logic to a custom hook</span>
                </div>
                <div className="critic-item">
                  <span className="severity warning">⚠️ WARN</span>
                  <span>Potential memory leak in useEffect</span>
                </div>
                <div className="critic-item">
                  <span className="severity success">✅ PASS</span>
                  <span>Code follows team conventions</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'testgen':
        return (
          <div className="window-content-demo">
            <div className="testgen-demo">
              <div className="testgen-header">
                <span>🧪 Auto-Test Suite Generator</span>
              </div>
              <div className="testgen-stats">
                <div className="stat">
                  <div className="stat-value">87%</div>
                  <div className="stat-label">Coverage</div>
                </div>
                <div className="stat">
                  <div className="stat-value">42</div>
                  <div className="stat-label">Tests Generated</div>
                </div>
                <div className="stat">
                  <div className="stat-value">✅</div>
                  <div className="stat-label">All Passing</div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="window-content-demo">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              {window.name} interface
            </p>
          </div>
        );
    }
  };

  return (
    <div className="desktop-experience-mockup">
      {/* Menu Bar */}
      <div className="de-menu-bar">
        <div className="menu-left">
          <div className="menu-logo">DLX OS</div>
          <div className="menu-items">
            <div className="menu-item">File</div>
            <div className="menu-item">Edit</div>
            <div className="menu-item">View</div>
            <div className="menu-item">AI</div>
          </div>
        </div>
        <div className="menu-right">
          {/* Hybrid Mode Toggle */}
          <div className="hybrid-mode-toggle">
            <button
              className={`mode-btn ${hybridMode === 'ai' ? 'active' : ''}`}
              onClick={() => setHybridMode('ai')}
            >
              🤖 AI Mode
            </button>
            <button
              className={`mode-btn ${hybridMode === 'deep' ? 'active' : ''}`}
              onClick={() => setHybridMode('deep')}
            >
              💻 Deep Mode
            </button>
          </div>
          {/* Performance Monitor */}
          <div className="perf-monitor">
            <span>⚡ 8ms</span>
            <span>📊 42MB</span>
          </div>
        </div>
      </div>

      {/* Desktop Area */}
      <div className="de-desktop">
        {/* App Windows */}
        {openWindows
          .filter((w) => !w.minimized)
          .map((window) => (
            <div
              key={window.id}
              className={`app-window ${window.color}`}
              style={{
                left: window.position.x,
                top: window.position.y,
              }}
            >
              <div className="window-titlebar">
                <div className="window-title">
                  <span className="window-icon">{window.icon}</span>
                  <span>{window.name}</span>
                </div>
                <div className="window-controls">
                  <button className="window-btn minimize" onClick={() => handleMinimize(window.id)}>
                    −
                  </button>
                  <button className="window-btn close" onClick={() => handleClose(window.id)}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="window-body">{renderWindowContent(window)}</div>
            </div>
          ))}

        {/* Context Indexer */}
        <div className="de-context-indexer">
          <div className="indexer-header">
            <span>🧠 Project Context</span>
          </div>
          <div className="indexer-graph">
            <div className="graph-node">App.tsx</div>
            <div className="graph-node">VibeEditor.tsx</div>
            <div className="graph-node">Services</div>
            <div className="graph-connection"></div>
          </div>
        </div>

        {/* Mood Environment Selector */}
        <div className="de-mood-selector">
          <div className="mood-header">Environment</div>
          {moods.map((mood) => (
            <div
              key={mood.id}
              className={`mood-option ${moodEnvironment === mood.id ? 'active' : ''}`}
              onClick={() => setMoodEnvironment(mood.id)}
            >
              <span>{mood.icon}</span>
              <span className="mood-name">{mood.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dock */}
      <div className="de-dock">
        {dockApps.map((app) => {
          const isOpen = openWindows.some((w) => w.id === app.id && !w.minimized);
          const isMinimized = openWindows.some((w) => w.id === app.id && w.minimized);
          return (
            <div
              key={app.id}
              className={`dock-app ${isOpen ? 'open' : ''} ${isMinimized ? 'minimized' : ''}`}
              onClick={() => handleLaunchApp(app.id)}
              title={app.name}
            >
              <span className="dock-icon">{app.icon}</span>
              {(isOpen || isMinimized) && <div className="dock-indicator"></div>}
            </div>
          );
        })}
      </div>

      {/* Vibed Ed Assistant - Picture in Picture */}
      <div className="de-pip-assistant">
        <div className="pip-video">
          <div className="pip-content">
            <div className="vibed-ed-avatar">😎</div>
            <div className="pip-text">
              <p>"Yo! Want me to generate those tests?"</p>
            </div>
          </div>
          <div className="pip-controls">
            <button className="pip-btn">✓ Yes</button>
            <button className="pip-btn">✕ No</button>
          </div>
        </div>
      </div>

      {/* Feature Labels */}
      <div className="feature-labels">
        <div className="feature-label" style={{ top: '70px', left: '50%', transform: 'translateX(-50%)' }}>
          <span className="label-tag">Hybrid AI/Deep Mode</span>
          <span className="label-arrow">↓</span>
        </div>
        <div className="feature-label" style={{ top: '150px', left: '20px' }}>
          <span className="label-tag">Multi-Window Apps</span>
          <span className="label-arrow">↗</span>
        </div>
        <div className="feature-label" style={{ bottom: '120px', left: '50%', transform: 'translateX(-50%)' }}>
          <span className="label-tag">Launchpad Dock</span>
          <span className="label-arrow">↑</span>
        </div>
        <div className="feature-label" style={{ bottom: '200px', right: '20px' }}>
          <span className="label-tag">PIP AI Assistant</span>
          <span className="label-arrow">↙</span>
        </div>
      </div>
    </div>
  );
}

export default DesktopExperienceMockup;

