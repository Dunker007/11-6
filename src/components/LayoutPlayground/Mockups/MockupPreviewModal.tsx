import React from 'react';
import { type MockupType } from '../LayoutMockupSelector';

interface MockupPreviewModalProps {
  mockupId: MockupType;
  onClose: () => void;
  onNavigate: (mockupId: MockupType) => void;
  onApply?: (mockupId: MockupType) => void;
  children: React.ReactNode;
}

const MOCKUP_ORDER: MockupType[] = [
  'studio-hub',
  'llm-revenue-command-center',
  'bolt-ai-workspace',
];

const MOCKUP_NAMES: Record<MockupType, string> = {
  'studio-hub': 'Studio Hub',
  'llm-revenue-command-center': 'LLM & Revenue Command Center',
  'bolt-ai-workspace': 'Bolt AI Workspace',
};

const MOCKUP_DESCRIPTIONS: Record<MockupType, string> = {
  'studio-hub': 'Professional development workspace focused on project management, code editing, and workflow orchestration.',
  'llm-revenue-command-center': 'Unified dashboard combining LLM optimization, model management, and revenue tracking with cost analysis.',
  'bolt-ai-workspace': 'AI-first conversational coding interface with turbo edits, smart context, and real-time AI assistance.',
};

function MockupPreviewModal({ mockupId, onClose, onNavigate, onApply, children }: MockupPreviewModalProps) {
  const currentIndex = MOCKUP_ORDER.indexOf(mockupId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < MOCKUP_ORDER.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(MOCKUP_ORDER[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(MOCKUP_ORDER[currentIndex + 1]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && hasPrevious) {
      handlePrevious();
    } else if (e.key === 'ArrowRight' && hasNext) {
      handleNext();
    }
  };

  return (
    <div
      className="mockup-preview-overlay"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mockup-title"
    >
      <div className="mockup-preview-modal">
        <div className="mockup-preview-header">
          <div className="mockup-info">
            <h2 id="mockup-title">{MOCKUP_NAMES[mockupId]}</h2>
            <p>{MOCKUP_DESCRIPTIONS[mockupId]}</p>
          </div>
          <button
            className="mockup-close-btn"
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className="mockup-preview-body">
          {children}
        </div>

        <div className="mockup-preview-footer">
          <div className="mockup-navigation">
            <button
              className="nav-btn"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              aria-label="Previous mockup"
            >
              ← Previous
            </button>
            <div className="mockup-indicator">
              {MOCKUP_ORDER.map((id) => (
                <div
                  key={id}
                  className={`indicator-dot ${id === mockupId ? 'active' : ''}`}
                  onClick={() => onNavigate(id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to ${MOCKUP_NAMES[id]}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onNavigate(id);
                    }
                  }}
                />
              ))}
            </div>
            <button
              className="nav-btn"
              onClick={handleNext}
              disabled={!hasNext}
              aria-label="Next mockup"
            >
              Next →
            </button>
          </div>

          <div className="mockup-actions">
            <button className="action-btn secondary" onClick={onClose}>
              Back to Selector
            </button>
            <button 
              className="action-btn primary" 
              onClick={() => {
                if (onApply) {
                  onApply(mockupId);
                } else if (mockupId === 'llm-revenue-command-center') {
                  // Open the LLM Optimizer panel - this will also close LayoutPlayground
                  window.dispatchEvent(new CustomEvent('open-quicklab', { detail: 'optimizer' }));
                  // Close the preview modal
                  onClose();
                } else if (mockupId === 'studio-hub' || mockupId === 'bolt-ai-workspace') {
                  // These mockups are previews - for now, just close the modal
                  // In the future, these could dispatch events to switch to these layouts
                  onClose();
                }
              }}
            >
              Apply Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockupPreviewModal;
