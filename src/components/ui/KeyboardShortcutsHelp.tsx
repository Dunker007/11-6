import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import '../../styles/KeyboardShortcutsHelp.css';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Alt', '1'], description: 'LLM Optimization' },
        { keys: ['Alt', '2'], description: 'Revenue Dashboard' },
        { keys: ['Alt', '3'], description: 'Vibed Ed' },
        { keys: ['Alt', '4'], description: 'Google AI Hub' },
        { keys: ['Alt', '5'], description: 'Crypto Lab' },
        { keys: ['Alt', '6'], description: 'Wealth Lab' },
        { keys: ['Alt', '7'], description: 'Idea Lab' },
        { keys: ['Alt', '8'], description: 'Workflows' },
        { keys: ['Alt', '9'], description: 'Quick Labs' },
        { keys: ['Alt', '0'], description: 'Settings' },
      ],
    },
    {
      category: 'Google AI Hub',
      items: [
        { keys: ['1'], description: 'AI Studio Projects' },
        { keys: ['2'], description: 'Visual-to-Code' },
        { keys: ['3'], description: 'Smart Comments' },
        { keys: ['4'], description: 'Project Q&A' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { keys: ['Ctrl', 'Enter'], description: 'Submit (in text areas)' },
        { keys: ['Ctrl', 'Shift', 'I'], description: 'Toggle Insights Stream' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Esc'], description: 'Close dialogs' },
      ],
    },
  ];

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div
        className="keyboard-shortcuts-modal animate-spring-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
      >
        <div className="shortcuts-header">
          <div className="shortcuts-title-row">
            <Keyboard size={24} />
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          </div>
          <button
            className="shortcuts-close-btn"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            <X size={20} />
          </button>
        </div>

        <div className="shortcuts-content">
          {shortcuts.map((section) => (
            <div key={section.category} className="shortcuts-section">
              <h3 className="shortcuts-category">{section.category}</h3>
              <div className="shortcuts-list">
                {section.items.map((item, idx) => (
                  <div key={idx} className="shortcut-item">
                    <div className="shortcut-keys">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="shortcut-key">{key}</kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="shortcut-separator">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="shortcut-description">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <p>Press <kbd>?</kbd> anytime to show this help</p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
