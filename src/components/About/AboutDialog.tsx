import { useState, useEffect } from 'react';
import { useVersionStore } from '../../services/system/versionStore';
import '../../styles/AboutDialog.css';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const { appVersion, loadAppVersion } = useVersionStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAppVersion();
    }
  }, [isOpen, loadAppVersion]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘K / Ctrl+K', desc: 'Open Command Palette' },
    { key: '⌘Shift+A / Ctrl+Shift+A', desc: 'Toggle AI Chat' },
    { key: '⌘Q / Ctrl+Q', desc: 'Quit Application' },
    { key: '⌘R / Ctrl+R', desc: 'Reload Window' },
    { key: '⌘, / Ctrl+,', desc: 'Open Settings (if available)' },
  ];

  return (
    <div className="about-dialog-overlay" onClick={onClose}>
      <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <div className="about-logo">
            <img src="/vibdee-logo.svg" alt="DLX Studios" />
          </div>
          <h1>DLX Studios Ultimate</h1>
          <p className="about-tagline">AI-Native Development Platform</p>
        </div>

        <div className="about-content">
          <div className="about-section">
            <h2>Version</h2>
            <p className="about-version">
              {appVersion?.version || '1.0.0'}
              {appVersion?.buildDate && (
                <span className="about-build-date">
                  {' '}• Built {appVersion.buildDate.toLocaleDateString()}
                </span>
              )}
            </p>
          </div>

          <div className="about-section">
            <h2>About</h2>
            <p>
              DLX Studios Ultimate is an AI-native development platform featuring VibeEditor,
              an intelligent code editor powered by AI assistance. Build, deploy, monitor, and
              monetize your projects all in one place.
            </p>
          </div>

          <div className="about-section">
            <button
              className="about-toggle"
              onClick={() => setShowShortcuts(!showShortcuts)}
            >
              {showShortcuts ? '▼' : '▶'} Keyboard Shortcuts
            </button>
            {showShortcuts && (
              <div className="about-shortcuts">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <kbd className="shortcut-key">{shortcut.key}</kbd>
                    <span className="shortcut-desc">{shortcut.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="about-section">
            <h2>Links</h2>
            <div className="about-links">
              <a
                href="https://github.com/Dunker007/11-6"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository
              </a>
              <a
                href="https://github.com/Dunker007/11-6/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                Report an Issue
              </a>
            </div>
          </div>

          <div className="about-section">
            <h2>License</h2>
            <p className="about-license">MIT License © 2024 DLX Studios</p>
          </div>
        </div>

        <div className="about-footer">
          <button className="about-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutDialog;

