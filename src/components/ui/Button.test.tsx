import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { Check } from 'lucide-react';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('ui-button--primary');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('ui-button--secondary');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('ui-button--danger');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('ui-button--sm');
    
    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('ui-button--md');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('ui-button--lg');
  });

  it('should be disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('ui-button--disabled');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('ui-button--disabled');
  });

  it('should show spinner when isLoading', () => {
    render(<Button isLoading>Loading</Button>);
    
    expect(screen.getByRole('button').querySelector('.ui-button__spinner')).toBeInTheDocument();
  });

  it('should render left icon', () => {
    render(<Button leftIcon={Check}>With Icon</Button>);
    
    expect(screen.getByRole('button').querySelector('.ui-button__icon--left')).toBeInTheDocument();
  });

  it('should render right icon', () => {
    render(<Button rightIcon={Check}>With Icon</Button>);
    
    expect(screen.getByRole('button').querySelector('.ui-button__icon--right')).toBeInTheDocument();
  });

  it('should not render icons when loading', () => {
    render(<Button leftIcon={Check} isLoading>Loading</Button>);
    
    expect(screen.getByRole('button').querySelector('.ui-button__icon--left')).not.toBeInTheDocument();
  });

  it('should apply fullWidth class', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('ui-button--full-width');
  });

  it('should apply hexagonal class', () => {
    render(<Button hexagonal>Hexagonal</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('ui-button--hexagonal');
  });

  it('should apply holographic class and glow color', () => {
    render(<Button holographic glowColor="cyan">Holographic</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ui-button--holographic');
    expect(button).toHaveClass('ui-button--glow-cyan');
  });

  it('should call onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Loading</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should pass through native button props', () => {
    render(<Button type="submit" aria-label="Submit form">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });
});

