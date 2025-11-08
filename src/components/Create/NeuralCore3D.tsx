import { useEffect, useState, memo } from 'react';
import '../../styles/NeuralCore3D.css';

const NeuralCore3D = memo(function NeuralCore3D() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="neural-core-3d">
      {/* Holographic sphere */}
      <div className="holo-sphere" style={{ transform: `rotateY(${rotation}deg) rotateX(${rotation * 0.5}deg)` }}>
        {/* Wireframe layers */}
        <div className="sphere-layer layer-1"></div>
        <div className="sphere-layer layer-2"></div>
        <div className="sphere-layer layer-3"></div>
        
        {/* Neural network nodes */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="neural-node"
            style={{
              transform: `rotate(${i * 30}deg) translateY(-60px)`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Orbiting data panels */}
      <div className="orbit-ring orbit-1" style={{ transform: `rotate(${rotation}deg)` }}>
        <div className="data-panel panel-1">
          <div className="panel-label">SYS</div>
          <div className="panel-value">98%</div>
        </div>
      </div>

      <div className="orbit-ring orbit-2" style={{ transform: `rotate(${-rotation * 0.8}deg)` }}>
        <div className="data-panel panel-2">
          <div className="panel-label">AI</div>
          <div className="panel-value">ONLINE</div>
        </div>
      </div>

      <div className="orbit-ring orbit-3" style={{ transform: `rotate(${rotation * 1.2}deg)` }}>
        <div className="data-panel panel-3">
          <div className="panel-label">LLM</div>
          <div className="panel-value">READY</div>
        </div>
      </div>

      {/* Particle field */}
      <div className="particle-field">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Scan lines */}
      <div className="scan-overlay">
        <div className="scan-line scan-horizontal"></div>
        <div className="scan-line scan-vertical"></div>
      </div>

      {/* Center core glow */}
      <div className="core-glow"></div>

      {/* Neural synapses connecting nodes */}
      <svg className="synapse-connections" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="synapseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--cyan-500)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--cyan-500)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--violet-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(8)].map((_, i) => {
          const angle1 = (i * 45) * (Math.PI / 180);
          const angle2 = ((i * 45) + 30) * (Math.PI / 180);
          const x1 = 200 + Math.cos(angle1) * 60;
          const y1 = 200 + Math.sin(angle1) * 60;
          const x2 = 200 + Math.cos(angle2) * 60;
          const y2 = 200 + Math.sin(angle2) * 60;
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#synapseGradient)"
              strokeWidth="1"
              className="synapse-line"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          );
        })}
      </svg>
    </div>
  );
});

export default NeuralCore3D;

