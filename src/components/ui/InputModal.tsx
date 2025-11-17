/**
 * InputModal.tsx
 * Simple modal for getting user input (replaces prompt())
 */

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import '@/styles/ui/InputModal.css';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({
  isOpen,
  title,
  placeholder = '',
  defaultValue = '',
  onSubmit,
  onCancel,
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="input-modal-overlay" onClick={onCancel}>
      <div className="input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="input-modal-header">
          <h3>{title}</h3>
          <button className="input-modal-close" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="input-modal-input"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="input-modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={!value.trim()}>
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
