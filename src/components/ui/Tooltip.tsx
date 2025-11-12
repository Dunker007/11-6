import React, { ReactNode } from 'react';
import '../../styles/ui/Tooltip.css';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

/**
 * Lightweight tooltip wrapper that reveals content on hover/focus with simple positioning.
 *
 * @param props - Tooltip content, trigger children, and placement options.
 * @returns Tooltip wrapper or plain children when disabled.
 */
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

