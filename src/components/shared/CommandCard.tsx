import { ReactNode } from 'react';
import '../../styles/CommandCard.css';

interface CommandCardProps {
  children: ReactNode;
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber';
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  showCorners?: boolean;
  showScanLine?: boolean;
  showGlow?: boolean;
}

function CommandCard({ 
  children, 
  variant = 'cyan',
  clickable = false,
  onClick,
  className = '',
  showCorners = true,
  showScanLine = true,
  showGlow = true
}: CommandCardProps) {
  return (
    <div 
      className={`command-card ${variant} ${clickable ? 'clickable' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="card-content">
        {children}
      </div>

      {showGlow && <div className={`card-glow ${variant}-glow`}></div>}
      {showScanLine && <div className="card-scan-line"></div>}

      {showCorners && (
        <div className="card-corners">
          <span className="corner c-tl"></span>
          <span className="corner c-tr"></span>
          <span className="corner c-bl"></span>
          <span className="corner c-br"></span>
        </div>
      )}
    </div>
  );
}

export default CommandCard;

