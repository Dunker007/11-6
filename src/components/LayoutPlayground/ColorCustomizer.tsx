import { useState } from 'react';
import type { ThemeColors } from '@/types/theme';
import { Save, X, RotateCcw } from 'lucide-react';

interface ColorCustomizerProps {
  colors: ThemeColors;
  onChange: (key: keyof ThemeColors, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
}

function ColorCustomizer({
  colors,
  onChange,
  onSave,
  onReset,
  onCancel,
}: ColorCustomizerProps) {
  const [localColors, setLocalColors] = useState<ThemeColors>(colors);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setLocalColors((prev) => ({ ...prev, [key]: value }));
    onChange(key, value);
  };

  const colorKeys: Array<keyof ThemeColors> = [
    'violet500',
    'cyan500',
    'amber500',
    'bgPrimary',
    'bgSecondary',
    'textPrimary',
    'textSecondary',
  ];

  return (
    <div className="color-customizer">
      <div className="customizer-header">
        <h3>Customize Colors</h3>
        <p>Adjust theme colors to match your preferences</p>
      </div>

      <div className="color-inputs">
        {colorKeys.map((key) => (
          <div key={key} className="color-input-group">
            <label htmlFor={key}>{key}</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                id={key}
                value={localColors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
              />
              <input
                type="text"
                value={localColors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="color-text-input"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="customizer-actions">
        <button className="action-btn save" onClick={onSave}>
          <Save size={16} />
          Save Theme
        </button>
        <button className="action-btn reset" onClick={onReset}>
          <RotateCcw size={16} />
          Reset
        </button>
        <button className="action-btn cancel" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ColorCustomizer;

