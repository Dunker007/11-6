import '../../styles/NeuralCore.css';

function NeuralCore() {
  return (
    <div className="neural-core">
      <div className="core-glow" />
      <div className="core-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              '--delay': `${i * 0.1}s`,
              '--angle': `${(i * 30)}deg`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="core-center">
        <div className="core-pulse" />
        <div className="core-icon">🧠</div>
      </div>
    </div>
  );
}

export default NeuralCore;

