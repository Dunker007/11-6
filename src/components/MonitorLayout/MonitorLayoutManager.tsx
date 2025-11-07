import { useState, useEffect } from 'react';
import { useMonitorStore } from '../../services/monitor/monitorStore';
import '../../styles/MonitorLayoutManager.css';

function MonitorLayoutManager() {
  const { displays, layouts, currentLayout, loadDisplays, loadLayouts, saveLayout, deleteLayout, applyLayout } = useMonitorStore();
  const [layoutName, setLayoutName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadDisplays();
    loadLayouts();
  }, []);

  const handleSaveLayout = async () => {
    if (!layoutName.trim() || displays.length === 0) return;
    
    await saveLayout({
      name: layoutName.trim(),
      monitors: displays.map((display) => ({
        id: display.id,
        bounds: display.bounds,
        scaleFactor: display.scaleFactor,
        isPrimary: display.isPrimary,
        name: display.name,
        resolution: display.resolution,
      })),
    });
    
    setLayoutName('');
    setShowSaveDialog(false);
  };

  const handleApplyLayout = async (layoutId: string) => {
    await applyLayout(layoutId);
  };

  const handleDeleteLayout = async (layoutId: string) => {
    if (confirm('Delete this layout?')) {
      await deleteLayout(layoutId);
    }
  };

  return (
    <div className="monitor-layout-manager">
      <div className="manager-header">
        <h2>Monitor Layout Manager</h2>
        <button onClick={() => loadDisplays()} className="refresh-btn">
          ↻ Refresh
        </button>
      </div>

      <div className="displays-section">
        <h3>Connected Displays ({displays.length}/4)</h3>
        <div className="displays-grid">
          {displays.map((display) => (
            <div key={display.id} className={`display-card ${display.isPrimary ? 'primary' : ''}`}>
              <div className="display-header">
                <h4>{display.name}</h4>
                {display.isPrimary && <span className="primary-badge">Primary</span>}
              </div>
              <div className="display-info">
                <div>Resolution: {display.resolution.width} × {display.resolution.height}</div>
                <div>Position: ({display.bounds.x}, {display.bounds.y})</div>
                <div>Scale: {display.scaleFactor}x</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="layouts-section">
        <div className="section-header">
          <h3>Saved Layouts</h3>
          <button onClick={() => setShowSaveDialog(true)} className="save-btn">
            💾 Save Current Layout
          </button>
        </div>

        {showSaveDialog && (
          <div className="save-dialog">
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Layout name..."
              className="layout-name-input"
              autoFocus
            />
            <div className="dialog-actions">
              <button onClick={handleSaveLayout} className="confirm-btn" disabled={!layoutName.trim()}>
                Save
              </button>
              <button onClick={() => { setShowSaveDialog(false); setLayoutName(''); }} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="layouts-list">
          {layouts.length === 0 ? (
            <div className="empty-state">No saved layouts. Save your current layout to get started.</div>
          ) : (
            layouts.map((layout) => (
              <div key={layout.id} className={`layout-item ${currentLayout?.id === layout.id ? 'active' : ''}`}>
                <div className="layout-info">
                  <h4>{layout.name}</h4>
                  {layout.description && <p>{layout.description}</p>}
                  <div className="layout-meta">
                    <span>{layout.monitors.length} monitor(s)</span>
                    <span>•</span>
                    <span>{new Date(layout.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="layout-actions">
                  <button onClick={() => handleApplyLayout(layout.id)} className="apply-btn">
                    Apply
                  </button>
                  <button onClick={() => handleDeleteLayout(layout.id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MonitorLayoutManager;

