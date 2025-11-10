import React, { ReactNode } from 'react';
import '../../styles/ui/Tooltip.css';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  disabled = false,
}) => {
  if (disabled) return <>{children}</>;

  return (
    <div className="ui-tooltip-wrapper">
      {children}
      <div className={`ui-tooltip ui-tooltip--${placement}`} role="tooltip">
        {content}
      </div>
    </div>
  );
};

