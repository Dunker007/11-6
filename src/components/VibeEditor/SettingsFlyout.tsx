import { useSettingsStore } from '@/services/settings/settingsStore';
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
      <div className="settings-flyout" onClick={(e) => e.stopPropagation()}>
        <div className="sf-header">
          <h3>Editor Settings</h3>
          <button className="sf-close" onClick={onClose}>×</button>
        </div>
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
      </div>
    </div>
  );
}


