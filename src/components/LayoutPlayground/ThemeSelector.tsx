import type { Theme } from '@/types/theme';
import '../../styles/ThemeSelector.css';

interface ThemeSelectorProps {
  themes: Theme[];
  selectedTheme: Theme | null;
  onSelect: (theme: Theme) => void;
}

function ThemeSelector({ themes, selectedTheme, onSelect }: ThemeSelectorProps) {
  const groupedThemes = themes.reduce((acc, theme) => {
    const group = theme.id.startsWith('custom-') ? 'Custom' : 'Built-in';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(theme);
    return acc;
  }, {} as Record<string, Theme[]>);

  return (
    <div className="theme-selector">
      <h3>Themes</h3>
      <div className="theme-list">
        {Object.entries(groupedThemes).map(([group, groupThemes]) => (
          <div key={group} className="theme-group">
            <div className="theme-group-header">{group}</div>
            {groupThemes.map((theme) => (
              <div
                key={theme.id}
                className={`theme-item ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                onClick={() => onSelect(theme)}
              >
                <div className="theme-item-preview">
                  <div
                    className="theme-preview-colors"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.violet500}, ${theme.colors.cyan500})`,
                    }}
                  />
                </div>
                <div className="theme-item-info">
                  <div className="theme-item-name">{theme.name}</div>
                  <div className="theme-item-mode">{theme.mode}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThemeSelector;

