import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../ui';

function AppearanceSettings() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'dark' | 'light' | 'auto' | null;
    const savedFontSize = localStorage.getItem('app-font-size');
    const savedAnimations = localStorage.getItem('app-animations');
    
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedAnimations !== null) setAnimationsEnabled(savedAnimations === 'true');
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme === 'auto' ? 'dark' : newTheme);
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    localStorage.setItem('app-font-size', newSize);
    document.documentElement.style.fontSize = newSize === 'small' ? '14px' : newSize === 'large' ? '18px' : '16px';
  };

  const handleAnimationsChange = (enabled: boolean) => {
    setAnimationsEnabled(enabled);
    localStorage.setItem('app-animations', enabled.toString());
    document.documentElement.setAttribute('data-animations', enabled ? 'enabled' : 'disabled');
  };

  return (
    <div className="appearance-settings">
      <div className="settings-section-header">
        <h2>Appearance Settings</h2>
        <p>Customize the look and feel of the application</p>
      </div>

      <Card variant="outlined">
        <CardHeader>
          <h3>Theme</h3>
        </CardHeader>
        <CardBody>
          <div className="settings-group">
            <div className="setting-item">
              <label>Color Theme</label>
              <select 
                className="setting-input"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light' | 'auto')}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Font Size</label>
              <select 
                className="setting-input"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={animationsEnabled}
                  onChange={(e) => handleAnimationsChange(e.target.checked)}
                />
                Enable animations
              </label>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default AppearanceSettings;

