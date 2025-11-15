// src/components/Desktop/WindowFrame.tsx
import React from 'react';

interface WindowFrameProps {
  title: string;
  children: React.ReactNode;
}

const WindowFrame = React.forwardRef<HTMLDivElement, WindowFrameProps>(
  ({ title, children }, ref) => {
    return (
      <div ref={ref} className="desktop-window">
        <div className="window-header">{title}</div>
        <div className="window-content">{children}</div>
      </div>
    );
  }
);

export default WindowFrame;
