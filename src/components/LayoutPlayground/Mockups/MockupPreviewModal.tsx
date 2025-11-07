import { type MockupType } from '../LayoutMockupSelector';

interface MockupPreviewModalProps {
  mockupId: MockupType;
  onClose: () => void;
  onNavigate: (mockupId: MockupType) => void;
  children: React.ReactNode;
}

const MOCKUP_ORDER: MockupType[] = ['command-center', 'desktop-experience', 'ai-os'];

const MOCKUP_NAMES: Record<MockupType, string> = {
  'command-center': 'Command Center',
  'desktop-experience': 'Desktop Experience',
  'ai-os': 'AI OS Mode',
};

const MOCKUP_DESCRIPTIONS: Record<MockupType, string> = {
  'command-center': 'Foundation Layer - Mission Control layout with organized workflows',
  'desktop-experience': 'Intelligence Layer - AI-powered desktop with tool apps',
  'ai-os': 'Ultimate Vibe Coding - Full OS experience with system-level AI',
};

function MockupPreviewModal({ mockupId, onClose, onNavigate, children }: MockupPreviewModalProps) {
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
              {MOCKUP_ORDER.map((id, index) => (
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
            <button className="action-btn primary" disabled>
              Apply Layout (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockupPreviewModal;

