import '../styles-new/vibed-ed.css';

interface VibedEdAvatarProps {
  size?: 'tiny' | 'small' | 'medium' | 'large';
  animated?: boolean;
  onClick?: () => void;
}

function VibedEdAvatar({ size = 'medium', animated = false, onClick }: VibedEdAvatarProps) {
  const sizeClass = `avatar-${size}`;

  return (
    <div
      className={`vibed-ed-avatar ${sizeClass} ${animated ? 'animated' : ''}`}
      onClick={onClick}
      title="Vibed Ed - Your AI coding companion"
    >
      <div className="avatar-body">
        <div className="avatar-head">
          <div className="avatar-eye left-eye">●</div>
          <div className="avatar-eye right-eye">●</div>
          <div className="avatar-mouth">―</div>
        </div>
        <div className="avatar-body-shape">
          <div className="avatar-circuit-top"></div>
          <div className="avatar-circuit-middle"></div>
          <div className="avatar-circuit-bottom"></div>
        </div>
      </div>

      {animated && (
        <div className="avatar-glow">
          <div className="glow-pulse"></div>
        </div>
      )}
    </div>
  );
}

export default VibedEdAvatar;
