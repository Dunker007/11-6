import { Card, CardBody } from '../ui';

/**
 * Placeholder panel for configuring general application preferences.
 *
 * @returns General settings form scaffolding with theme, language, and option toggles.
 */
function GeneralSettings() {
  return (
    <div className="general-settings">
      <div className="settings-section-header">
        <h2>General Settings</h2>
        <p>Configure general application preferences</p>
      </div>

      <Card variant="outlined">
        <CardBody>
          <div className="settings-group">
            <div className="setting-item">
              <label>Language</label>
              <select className="setting-input">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Theme</label>
              <select className="setting-input">
                <option>Dark</option>
                <option>Light</option>
                <option>Auto</option>
              </select>
            </div>

            <div className="setting-item">
              <label>
                <input type="checkbox" />
                Enable notifications
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input type="checkbox" />
                Auto-save projects
              </label>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default GeneralSettings;

