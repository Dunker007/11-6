import type { ThemeColors } from '@/types/theme';
import '../../styles/ColorCustomizer.css';

interface ColorCustomizerProps {
  colors: ThemeColors;
  onChange: (key: keyof ThemeColors, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
}

function ColorCustomizer({ colors, onChange, onSave, onReset, onCancel }: ColorCustomizerProps) {
  const colorGroups = [
    {
      label: 'Primary Colors',
      colors: [
        { key: 'violet500' as const, label: 'Violet 500' },
        { key: 'violet600' as const, label: 'Violet 600' },
        { key: 'cyan500' as const, label: 'Cyan 500' },
        { key: 'cyan600' as const, label: 'Cyan 600' },
        { key: 'amber500' as const, label: 'Amber 500' },
      ],
    },
    {
      label: 'Background',
      colors: [
        { key: 'bgPrimary' as const, label: 'Primary' },
        { key: 'bgSecondary' as const, label: 'Secondary' },
        { key: 'bgTertiary' as const, label: 'Tertiary' },
      ],
    },
    {
      label: 'Text',
      colors: [
        { key: 'textPrimary' as const, label: 'Primary' },
        { key: 'textSecondary' as const, label: 'Secondary' },
        { key: 'textMuted' as const, label: 'Muted' },
      ],
    },
  ];

  return (
    <div className="color-customizer">
      <div className="customizer-header">
        <h3>Customize Colors</h3>
        <p>Adjust colors to create your perfect theme</p>
      </div>

      <div className="customizer-content">
        {colorGroups.map((group) => (
          <div key={group.label} className="color-group">
            <h4>{group.label}</h4>
            <div className="color-inputs">
              {group.colors.map(({ key, label }) => (
                <div key={key} className="color-input">
                  <label>{label}</label>
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => onChange(key, e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={(e) => onChange(key, e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="customizer-actions">
          <button className="action-btn save" onClick={onSave}>
            Save Custom Theme
          </button>
          <button className="action-btn reset" onClick={onReset}>
            Reset Changes
          </button>
          <button className="action-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ColorCustomizer;

