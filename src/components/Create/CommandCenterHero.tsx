import { useState, useEffect } from 'react';
import { useProjectStore } from '../../services/project/projectStore';
import NeuralCore3D from './NeuralCore3D';
import '../../styles/CommandCenterHero.css';

function CommandCenterHero() {
  const { projects } = useProjectStore();
  const [stats, setStats] = useState({
    projects: 0,
    files: 0,
    linesOfCode: 0,
    aiInteractions: 0
  });

  useEffect(() => {
    // Calculate real stats
    const projectCount = projects.length;
    let totalFiles = 0;
    let totalLines = 0;

    projects.forEach(project => {
      totalFiles += Object.keys(project.files).length;
      Object.values(project.files).forEach(file => {
        totalLines += file.content.split('\n').length;
      });
    });

    // Animate the numbers
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        projects: Math.floor(projectCount * progress),
        files: Math.floor(totalFiles * progress),
        linesOfCode: Math.floor(totalLines * progress),
        aiInteractions: Math.floor(Math.random() * 1000 * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setStats({
          projects: projectCount,
          files: totalFiles,
          linesOfCode: totalLines,
          aiInteractions: Math.floor(Math.random() * 1000)
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [projects]);

  return (
    <div className="command-center-hero">
      {/* Background grid */}
      <div className="grid-background"></div>
      
      {/* Neural Core */}
      <div className="hero-core">
        <NeuralCore3D />
      </div>

      {/* Title Section */}
      <div className="hero-title">
        <div className="title-accent">
          <span className="accent-line"></span>
          <span className="accent-dot"></span>
        </div>
        <h1 className="main-title">
          <span className="title-primary">DLX</span>
          <span className="title-separator">|</span>
          <span className="title-secondary">COMMAND CENTER</span>
        </h1>
        <div className="title-subtitle">
          <span className="subtitle-text">Lux 2.0</span>
          <span className="subtitle-separator">•</span>
          <span className="subtitle-text">AI-First Architecture</span>
          <span className="subtitle-separator">•</span>
          <span className="subtitle-text">Turbo Development HUD</span>
        </div>
        <div className="title-accent bottom">
          <span className="accent-dot"></span>
          <span className="accent-line"></span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="hero-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <div className="hexagon-frame">
              <span className="icon-symbol">▣</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.projects}</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-ring"></div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <div className="hexagon-frame">
              <span className="icon-symbol">◈</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.files}</div>
            <div className="stat-label">Files</div>
          </div>
          <div className="stat-ring"></div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <div className="hexagon-frame">
              <span className="icon-symbol">◎</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.linesOfCode.toLocaleString()}</div>
            <div className="stat-label">Lines of Code</div>
          </div>
          <div className="stat-ring"></div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <div className="hexagon-frame">
              <span className="icon-symbol">◉</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.aiInteractions}</div>
            <div className="stat-label">AI Interactions</div>
          </div>
          <div className="stat-ring"></div>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="system-status">
        <div className="status-indicator online">
          <span className="status-led"></span>
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
        <div className="status-indicator online">
          <span className="status-led"></span>
          <span className="status-text">AI READY</span>
        </div>
        <div className="status-indicator online">
          <span className="status-led"></span>
          <span className="status-text">LLM CONNECTED</span>
        </div>
      </div>

      {/* Corner brackets */}
      <div className="corner-brackets">
        <span className="bracket top-left"></span>
        <span className="bracket top-right"></span>
        <span className="bracket bottom-left"></span>
        <span className="bracket bottom-right"></span>
      </div>
    </div>
  );
}

export default CommandCenterHero;

