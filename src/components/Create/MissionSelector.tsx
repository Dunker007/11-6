import TechIcon from '../Icons/TechIcon';
import { FileCode, Brain } from 'lucide-react';
import '../../styles/MissionSelector.css';

interface MissionSelectorProps {
  onSelectTemplate: () => void;
  onSelectAI: () => void;
}

function MissionSelector({ onSelectTemplate, onSelectAI }: MissionSelectorProps) {
  return (
    <div className="mission-selector">
      <div className="mission-header">
        <span className="header-line"></span>
        <h2 className="mission-title">INITIATE MISSION</h2>
        <span className="header-line"></span>
      </div>

      <div className="mission-panels">
        {/* Template Mission Panel */}
        <div className="mission-panel template-panel" onClick={onSelectTemplate}>
          <div className="panel-hexagon">
            <svg className="hex-border" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="hexGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--cyan-500)" />
                  <stop offset="100%" stopColor="var(--violet-500)" />
                </linearGradient>
              </defs>
              <polygon 
                points="100,10 170,50 170,130 100,170 30,130 30,50" 
                stroke="url(#hexGradient1)"
                strokeWidth="2"
                fill="none"
                className="hex-path"
              />
            </svg>
          </div>

          <div className="panel-content">
            <div className="panel-icon">
              <TechIcon 
                icon={FileCode}
                size={48}
                variant="hexagon"
                glow="cyan"
                animated={false}
              />
            </div>

            <div className="panel-header-text">
              <h3 className="panel-title">DEPLOY FROM TEMPLATE</h3>
              <div className="panel-code">{'{ MISSION_TYPE: "TEMPLATE" }'}</div>
            </div>

            <p className="panel-description">
              Select pre-configured architecture. Rapid deployment protocol.
              Optimized build sequences ready for immediate execution.
            </p>

            <div className="panel-features">
              <div className="feature-item">
                <span className="feature-icon">▸</span>
                <span className="feature-text">Pre-built structures</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">▸</span>
                <span className="feature-text">Instant deployment</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">▸</span>
                <span className="feature-text">Battle-tested</span>
              </div>
            </div>

            <button className="panel-action-btn">
              <span className="btn-text">ENGAGE TEMPLATE PROTOCOL</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>

          <div className="panel-glow cyan-glow"></div>
          <div className="panel-scan-line"></div>

          {/* Corner accents */}
          <div className="panel-corners">
            <span className="corner c-tl"></span>
            <span className="corner c-tr"></span>
            <span className="corner c-bl"></span>
            <span className="corner c-br"></span>
          </div>
        </div>

        {/* AI Generation Mission Panel */}
        <div className="mission-panel ai-panel" onClick={onSelectAI}>
          <div className="panel-hexagon">
            <svg className="hex-border" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="hexGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--violet-500)" />
                  <stop offset="100%" stopColor="var(--cyan-500)" />
                </linearGradient>
              </defs>
              <polygon 
                points="100,10 170,50 170,130 100,170 30,130 30,50" 
                stroke="url(#hexGradient2)"
                strokeWidth="2"
                fill="none"
                className="hex-path"
              />
            </svg>
          </div>

          <div className="panel-content">
            <div className="panel-icon">
              <TechIcon 
                icon={Brain}
                size={48}
                variant="hexagon"
                glow="violet"
                animated={true}
              />
            </div>

            <div className="panel-header-text">
              <h3 className="panel-title">AI ARCHITECTURE GENERATOR</h3>
              <div className="panel-code">{'{ MISSION_TYPE: "AI_GEN" }'}</div>
            </div>

            <p className="panel-description">
              DeAI Creator Ecosystem. Neural architecture synthesis.
              Describe intent, AI generates complete project structure.
            </p>

            <div className="panel-features">
              <div className="feature-item">
                <span className="feature-icon">▸</span>
                <span className="feature-text">Neural synthesis</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">▸</span>
                <span className="feature-text">Intent-based generation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">▸</span>
                <span className="feature-text">Adaptive architecture</span>
              </div>
            </div>

            <button className="panel-action-btn">
              <span className="btn-text">INITIATE AI GENERATION</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>

          <div className="panel-glow violet-glow"></div>
          <div className="panel-scan-line"></div>

          {/* Corner accents */}
          <div className="panel-corners">
            <span className="corner c-tl"></span>
            <span className="corner c-tr"></span>
            <span className="corner c-bl"></span>
            <span className="corner c-br"></span>
          </div>

          {/* Neural network animation overlay */}
          <div className="neural-overlay">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="neural-node"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${10 + i * 20}%`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionSelector;

