import { ReactNode } from 'react';
import NeuralCore3D from '../Create/NeuralCore3D';
import '../../styles/WorkflowHero.css';

interface WorkflowHeroProps {
  title: string;
  subtitle?: string;
  showCore?: boolean;
  stats?: Array<{
    icon: string;
    value: string | number;
    label: string;
  }>;
  statusIndicators?: Array<{
    label: string;
    status: 'online' | 'offline' | 'warning';
  }>;
  children?: ReactNode;
}

function WorkflowHero({ 
  title, 
  subtitle, 
  showCore = true, 
  stats, 
  statusIndicators,
  children 
}: WorkflowHeroProps) {
  return (
    <div className="workflow-hero">
      {/* Background grid */}
      <div className="grid-background"></div>
      
      {/* Neural Core */}
      {showCore && (
        <div className="hero-core">
          <NeuralCore3D />
        </div>
      )}

      {/* Title Section */}
      <div className="hero-title">
        <div className="title-accent">
          <span className="accent-line"></span>
          <span className="accent-dot"></span>
        </div>
        <h1 className="main-title">{title}</h1>
        {subtitle && (
          <div className="title-subtitle">
            <span className="subtitle-text">{subtitle}</span>
          </div>
        )}
        <div className="title-accent bottom">
          <span className="accent-dot"></span>
          <span className="accent-line"></span>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="hero-stats">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <div className="hexagon-frame">
                  <span className="icon-symbol">{stat.icon}</span>
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-ring"></div>
            </div>
          ))}
        </div>
      )}

      {/* System Status Indicators */}
      {statusIndicators && statusIndicators.length > 0 && (
        <div className="system-status">
          {statusIndicators.map((indicator, index) => (
            <div key={index} className={`status-indicator ${indicator.status}`}>
              <span className="status-led"></span>
              <span className="status-text">{indicator.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom content */}
      {children}

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

export default WorkflowHero;

