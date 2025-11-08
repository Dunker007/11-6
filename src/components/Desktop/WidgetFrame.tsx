// src/components/Desktop/WidgetFrame.tsx
import React from 'react';

interface WidgetFrameProps {
  children: React.ReactNode;
}

const WidgetFrame = React.forwardRef<HTMLDivElement, WidgetFrameProps>(({ children }, ref) => {
  return (
    <div ref={ref} className="desktop-widget">
      {children}
    </div>
  );
});

export default WidgetFrame;
