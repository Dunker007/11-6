import { useState, useEffect, useMemo } from 'react';
import { themeService } from '../../services/theme/themeService';
import type { Theme, ThemeColors } from '@/types/theme';
import ThemeSelector from './ThemeSelector';
import ColorCustomizer from './ColorCustomizer';
import LayoutMockupSelector, { type MockupType } from './LayoutMockupSelector';
import MockupPreviewModal from './Mockups/MockupPreviewModal';
import CommandCenterMockup from './Mockups/CommandCenterMockup';
import DesktopExperienceMockup from './Mockups/DesktopExperienceMockup';
import AIOSModeMockup from './Mockups/AIOSModeMockup';
import '../../styles/LayoutPlayground.css';

type PlaygroundTab = 'themes' | 'layouts';

function LayoutPlayground() {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('themes');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customColors, setCustomColors] = useState<ThemeColors | null>(null);
  const [previewMockup, setPreviewMockup] = useState<MockupType | null>(null);

  useEffect(() => {
    const allThemes = themeService.getAllThemes();
    setThemes(allThemes);
    const current = themeService.getCurrentTheme();
    setSelectedTheme(current);
  }, []);

  const handleThemeSelect = (theme: Theme) => {
    themeService.setTheme(theme.id);
    setSelectedTheme(theme);
    setIsCustomizing(false);
  };

  const handleStartCustomize = () => {
    if (selectedTheme) {
      setCustomColors({ ...selectedTheme.colors });
      setIsCustomizing(true);
    }
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    if (customColors) {
      setCustomColors({ ...customColors, [key]: value });
    }
  };

  const handleSaveCustomTheme = () => {
    if (!customColors || !selectedTheme) return;

    const name = prompt('Theme name:') || 'Custom Theme';
    const description = prompt('Theme description:') || 'Custom theme';

    const customTheme = themeService.createCustomTheme(name, description, customColors);
    themeService.setTheme(customTheme.id);
    setSelectedTheme(customTheme);
    setIsCustomizing(false);
    
    // Refresh themes list
    setThemes(themeService.getAllThemes());
  };

  const handleDeleteCustomTheme = () => {
    if (!selectedTheme || !selectedTheme.id.startsWith('custom-')) return;
    
    if (confirm(`Delete theme "${selectedTheme.name}"?`)) {
      themeService.deleteCustomTheme(selectedTheme.id);
      const allThemes = themeService.getAllThemes();
      setThemes(allThemes);
      const current = themeService.getCurrentTheme();
      setSelectedTheme(current);
    }
  };

  const handleReset = () => {
    if (selectedTheme) {
      setCustomColors({ ...selectedTheme.colors });
    }
  };

  const handlePreviewMockup = (mockupId: MockupType) => {
    setPreviewMockup(mockupId);
  };

  const handleCloseMockup = () => {
    setPreviewMockup(null);
  };

  const previewTheme = useMemo(() => {
    if (isCustomizing && customColors && selectedTheme) {
      return {
        ...selectedTheme,
        colors: customColors,
      };
    }
    return selectedTheme;
  }, [isCustomizing, customColors, selectedTheme]);

  return (
    <div className="layout-playground">
      <div className="playground-header">
        <h2>Layout Playground</h2>
        <p>Customize themes, visual styles, and explore future layouts</p>
      </div>

      <div className="playground-tabs">
        <button
          className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          Theme Customization
        </button>
        <button
          className={`tab-btn ${activeTab === 'layouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('layouts')}
        >
          Layout Mockups
        </button>
      </div>

      <div className="playground-content">
        {activeTab === 'themes' ? (
          <>
            <div className="playground-sidebar">
              <ThemeSelector
                themes={themes}
                selectedTheme={selectedTheme}
                onSelect={handleThemeSelect}
              />
            </div>

            <div className="playground-main">
              {previewTheme && (
                <>
                  {isCustomizing ? (
                    <ColorCustomizer
                      colors={customColors!}
                      onChange={handleColorChange}
                      onSave={handleSaveCustomTheme}
                      onReset={handleReset}
                      onCancel={() => setIsCustomizing(false)}
                    />
                  ) : (
                    <div className="theme-preview">
                      <div className="preview-header">
                        <h3>{previewTheme.name}</h3>
                        <p>{previewTheme.description}</p>
                        <div className="preview-actions">
                          <button className="preview-btn" onClick={handleStartCustomize}>
                            Customize Colors
                          </button>
                          {previewTheme.id.startsWith('custom-') && (
                            <button className="preview-btn delete" onClick={handleDeleteCustomTheme}>
                              Delete Theme
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="preview-demo">
                        <div className="demo-card">
                          <h4>Preview Card</h4>
                          <p>This is how your theme looks</p>
                          <div className="demo-buttons">
                            <button className="demo-btn primary">Primary Button</button>
                            <button className="demo-btn secondary">Secondary Button</button>
                          </div>
                        </div>

                        <div className="demo-colors">
                          <div className="color-swatch" style={{ background: previewTheme.colors.violet500 }}>
                            <span>Violet</span>
                          </div>
                          <div className="color-swatch" style={{ background: previewTheme.colors.cyan500 }}>
                            <span>Cyan</span>
                          </div>
                          <div className="color-swatch" style={{ background: previewTheme.colors.amber500 }}>
                            <span>Amber</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="layout-mockups-container">
            <LayoutMockupSelector onPreview={handlePreviewMockup} />
          </div>
        )}
      </div>

      {previewMockup && (
        <MockupPreviewModal
          mockupId={previewMockup}
          onClose={handleCloseMockup}
          onNavigate={handlePreviewMockup}
        >
          {previewMockup === 'command-center' && <CommandCenterMockup />}
          {previewMockup === 'desktop-experience' && <DesktopExperienceMockup />}
          {previewMockup === 'ai-os' && <AIOSModeMockup />}
        </MockupPreviewModal>
      )}
    </div>
  );
}

export default LayoutPlayground;

