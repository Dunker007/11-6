/**
 * UserPreferences.tsx
 *
 * Comprehensive settings panel for user preferences
 * ✨ NOW WITH FULL ENFORCEMENT - CHANGES ARE APPLIED IMMEDIATELY!
 */

import React, { useState } from 'react';
import { usePreferences } from '../../hooks/usePreferences';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import './UserPreferences.css';

export const UserPreferences: React.FC = () => {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleReset = () => {
    resetPreferences();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="user-preferences">
      <div className="preferences-header">
        <h2>User Preferences</h2>
        <div className="header-actions">
          {showSuccess && <span className="success-message">✓ Preferences reset!</span>}
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="preferences-info">
        <p className="info-text">
          ✨ All changes are applied immediately - no save button needed!
        </p>
      </div>

      {/* General Settings */}
      <Card className="preferences-section">
        <h3>General</h3>

        <div className="preference-item">
          <label>Theme</label>
          <select
            value={preferences.general.theme}
            onChange={(e) =>
              updatePreferences('general', { theme: e.target.value as any })
            }
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="preference-item">
          <label>Language</label>
          <select
            value={preferences.general.language}
            onChange={(e) =>
              updatePreferences('general', { language: e.target.value })
            }
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="preference-item">
          <label>Currency</label>
          <select
            value={preferences.general.currency}
            onChange={(e) =>
              updatePreferences('general', { currency: e.target.value })
            }
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="preferences-section">
        <h3>Notifications</h3>

        <div className="preference-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={preferences.notifications.desktop}
              onChange={(e) =>
                updatePreferences('notifications', { desktop: e.target.checked })
              }
            />
            Desktop Notifications
          </label>
        </div>

        <div className="preference-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={preferences.notifications.email}
              onChange={(e) =>
                updatePreferences('notifications', { email: e.target.checked })
              }
            />
            Email Notifications
          </label>
        </div>

        <div className="preference-item">
          <label>Frequency</label>
          <select
            value={preferences.notifications.frequency}
            onChange={(e) =>
              updatePreferences('notifications', { frequency: e.target.value as any })
            }
          >
            <option value="real-time">Real-time</option>
            <option value="hourly">Hourly Digest</option>
            <option value="daily">Daily Digest</option>
          </select>
        </div>
      </Card>

      {/* AI Behavior */}
      <Card className="preferences-section">
        <h3>AI Behavior</h3>

        <div className="preference-item">
          <label>Aggressiveness</label>
          <select
            value={preferences.ai.aggressiveness}
            onChange={(e) =>
              updatePreferences('ai', { aggressiveness: e.target.value as any })
            }
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div className="preference-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={preferences.ai.autoApprove}
              onChange={(e) =>
                updatePreferences('ai', { autoApprove: e.target.checked })
              }
            />
            Auto-approve AI actions
          </label>
        </div>

        <div className="preference-item">
          <label>Max Cost Per Day ($)</label>
          <input
            type="number"
            value={preferences.ai.maxCostPerDay}
            onChange={(e) =>
              updatePreferences('ai', { maxCostPerDay: parseFloat(e.target.value) })
            }
            min="0"
            step="1"
          />
        </div>
      </Card>

      {/* Privacy */}
      <Card className="preferences-section">
        <h3>Privacy</h3>

        <div className="preference-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={preferences.privacy.analyticsSharing}
              onChange={(e) =>
                updatePreferences('privacy', { analyticsSharing: e.target.checked })
              }
            />
            Share analytics data
          </label>
        </div>

        <div className="preference-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={preferences.privacy.errorReporting}
              onChange={(e) =>
                updatePreferences('privacy', { errorReporting: e.target.checked })
              }
            />
            Send error reports
          </label>
        </div>
      </Card>

      {/* Accessibility */}
      <Card className="preferences-section">
        <h3>Accessibility</h3>

        <div className="preference-item">
          <label>Font Size</label>
          <select
            value={preferences.accessibility.fontSize}
            onChange={(e) =>
              updatePreferences('accessibility', { fontSize: e.target.value as any })
            }
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="preference-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={preferences.accessibility.highContrast}
              onChange={(e) =>
                updatePreferences('accessibility', { highContrast: e.target.checked })
              }
            />
            High Contrast Mode
          </label>
        </div>

        <div className="preference-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={preferences.accessibility.reducedMotion}
              onChange={(e) =>
                updatePreferences('accessibility', { reducedMotion: e.target.checked })
              }
            />
            Reduce Motion
          </label>
        </div>
      </Card>
    </div>
  );
};

export default UserPreferences;
