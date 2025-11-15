import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// Test component that uses toast
const TestComponent = () => {
  const { showToast, removeToast } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast({ variant: 'success', message: 'Success!' })}>
        Show Success
      </button>
      <button onClick={() => showToast({ variant: 'error', title: 'Error', message: 'Something went wrong' })}>
        Show Error
      </button>
      <button onClick={() => showToast({ variant: 'info', message: 'Info message', duration: 1000 })}>
        Show Info
      </button>
      <button onClick={() => {
        showToast({ variant: 'warning', message: 'Warning' });
      }}>
        Show Warning
      </button>
    </div>
  );
};

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render toast provider', () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    );
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

    it('should show toast when showToast is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should show toast with title and message', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Error');
    fireEvent.click(button);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    fireEvent.click(button);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('ui-toast--success');
  });

  it('should auto-dismiss toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Info');
    fireEvent.click(button);
    
    expect(screen.getByText('Info message')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  it('should remove toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    fireEvent.click(button);
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('should show multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const successButton = screen.getByText('Show Success');
    const errorButton = screen.getByText('Show Error');
    
    fireEvent.click(successButton);
    fireEvent.click(errorButton);
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should throw error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within ToastProvider');
    
    console.error = originalError;
  });

  it('should render toast container with proper aria attributes', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    fireEvent.click(button);
    
    const container = screen.getByLabelText('Notifications');
    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('should render toast with assertive aria-live', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    fireEvent.click(button);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });
});

