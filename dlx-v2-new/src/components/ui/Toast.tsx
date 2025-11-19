/**
 * Toast Notification System
 * Beautiful toast notifications with cyberpunk styling
 */

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(10, 10, 15, 0.95)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
        },
        className: 'cyber-toast',
      }}
      richColors
      closeButton
    />
  );
}

export { toast } from 'sonner';
