/**
 * Settings panel exposing advanced configuration toggles and maintenance actions.
 *
 * @returns Advanced settings form for debug, logging, caching, and data reset controls.
 */
function AdvancedSettings() {
  return (
    <div className="advanced-settings">
      <div className="settings-section-header">
        <h2>Advanced Settings</h2>
        <p>Advanced configuration options</p>
      </div>

      <div className="settings-group">
        <div className="setting-item">
          <label>Debug Mode</label>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <label>Log Level</label>
          <select className="setting-input">
            <option>Error</option>
            <option>Warning</option>
            <option>Info</option>
            <option>Debug</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Cache Size (MB)</label>
          <input type="number" className="setting-input" defaultValue={100} min={10} max={1000} />
        </div>

        <div className="setting-item">
          <button className="danger-button">Clear All Data</button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedSettings;

