import { useSettingsStore } from '@/services/settings/settingsStore';
import DraggablePanel from '../ui/DraggablePanel';
import '@/styles/SettingsFlyout.css';

interface SettingsFlyoutProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsFlyout({ visible, onClose }: SettingsFlyoutProps) {
  const { enableHotkeys, formatOnApply, defaultSplit, setEnableHotkeys, setFormatOnApply, setDefaultSplit } = useSettingsStore();
  if (!visible) return null;
  return (
    <div className="settings-flyout-overlay" onClick={onClose}>
      <DraggablePanel
        title="Editor Settings"
        onClose={onClose}
        defaultPosition={{ x: window.innerWidth - 420, y: 100 }}
        defaultSize={{ width: 400, height: 300 }}
        storageKey="settings-flyout"
        className="settings-draggable-panel"
      >
        <div className="sf-body">
          <div className="sf-item">
            <label>
              <input type="checkbox" checked={enableHotkeys} onChange={(e) => setEnableHotkeys(e.target.checked)} />
              Enable keyboard shortcuts
            </label>
          </div>
          <div className="sf-item">
            <label>
              <input type="checkbox" checked={formatOnApply} onChange={(e) => setFormatOnApply(e.target.checked)} />
              Format on apply (Prettier)
            </label>
          </div>
          <div className="sf-item">
            <label>Default split direction</label>
            <div className="sf-radio-row">
              <label>
                <input type="radio" name="split" checked={defaultSplit === 'vertical'} onChange={() => setDefaultSplit('vertical')} />
                Vertical
              </label>
              <label>
                <input type="radio" name="split" checked={defaultSplit === 'horizontal'} onChange={() => setDefaultSplit('horizontal')} />
                Horizontal
              </label>
            </div>
          </div>
        </div>
      </DraggablePanel>
    </div>
  );
}


