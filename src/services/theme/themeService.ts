import type { Theme, ThemeColors, CustomTheme } from '@/types/theme';

const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Holographic',
  description: 'Default holographic theme with violet and cyan accents',
  mode: 'dark',
  colors: {
    violet500: '#8B5CF6',
    violet600: '#7C3AED',
    cyan500: '#06B6D4',
    cyan600: '#0891B2',
    amber500: '#F59E0B',
    bgPrimary: '#0F172A',
    bgSecondary: '#1E293B',
    bgTertiary: '#334155',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    glowViolet: '0 0 20px rgba(139, 92, 246, 0.5)',
    glowCyan: '0 0 20px rgba(6, 182, 212, 0.5)',
  },
};

const THEMES: Theme[] = [
  DEFAULT_THEME,
  {
    id: 'dark-minimal',
    name: 'Dark Minimal',
    description: 'Clean dark theme with minimal colors',
    mode: 'dark',
    colors: {
      violet500: '#A78BFA',
      violet600: '#8B5CF6',
      cyan500: '#22D3EE',
      cyan600: '#06B6D4',
      amber500: '#FBBF24',
      bgPrimary: '#111827',
      bgSecondary: '#1F2937',
      bgTertiary: '#374151',
      textPrimary: '#F9FAFB',
      textSecondary: '#D1D5DB',
      textMuted: '#9CA3AF',
      glowViolet: '0 0 15px rgba(167, 139, 250, 0.3)',
      glowCyan: '0 0 15px rgba(34, 211, 238, 0.3)',
    },
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'High-contrast neon cyberpunk theme',
    mode: 'dark',
    colors: {
      violet500: '#FF00FF',
      violet600: '#CC00CC',
      cyan500: '#00FFFF',
      cyan600: '#00CCCC',
      amber500: '#FFFF00',
      bgPrimary: '#000000',
      bgSecondary: '#1A0033',
      bgTertiary: '#330066',
      textPrimary: '#FFFFFF',
      textSecondary: '#FF00FF',
      textMuted: '#CC00CC',
      glowViolet: '0 0 30px rgba(255, 0, 255, 0.8)',
      glowCyan: '0 0 30px rgba(0, 255, 255, 0.8)',
    },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme',
    mode: 'light',
    colors: {
      violet500: '#7C3AED',
      violet600: '#6D28D9',
      cyan500: '#0891B2',
      cyan600: '#0E7490',
      amber500: '#D97706',
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F8FAFC',
      bgTertiary: '#F1F5F9',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      glowViolet: '0 0 15px rgba(124, 58, 237, 0.2)',
      glowCyan: '0 0 15px rgba(8, 145, 178, 0.2)',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'High contrast theme for accessibility',
    mode: 'high-contrast',
    colors: {
      violet500: '#9333EA',
      violet600: '#7E22CE',
      cyan500: '#06B6D4',
      cyan600: '#0891B2',
      amber500: '#F59E0B',
      bgPrimary: '#000000',
      bgSecondary: '#1A1A1A',
      bgTertiary: '#333333',
      textPrimary: '#FFFFFF',
      textSecondary: '#E5E5E5',
      textMuted: '#CCCCCC',
      glowViolet: '0 0 25px rgba(147, 51, 234, 1)',
      glowCyan: '0 0 25px rgba(6, 182, 212, 1)',
    },
  },
];

class ThemeService {
  private static instance: ThemeService;
  private currentThemeId: string = 'default';
  private customThemes: Map<string, CustomTheme> = new Map();

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
      ThemeService.instance.loadTheme();
    }
    return ThemeService.instance;
  }

  getAllThemes(): Theme[] {
    return [...THEMES, ...Array.from(this.customThemes.values())];
  }

  getTheme(id: string): Theme | null {
    if (id === 'default' || THEMES.find((t) => t.id === id)) {
      return THEMES.find((t) => t.id === id) || DEFAULT_THEME;
    }
    return this.customThemes.get(id) || null;
  }

  getCurrentTheme(): Theme {
    return this.getTheme(this.currentThemeId) || DEFAULT_THEME;
  }

  setTheme(id: string): void {
    const theme = this.getTheme(id);
    if (!theme) return;

    this.currentThemeId = id;
    this.applyTheme(theme);
    this.saveTheme();
  }

  createCustomTheme(name: string, description: string, colors: ThemeColors): CustomTheme {
    const customTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name,
      description,
      mode: 'dark',
      colors,
      isCustom: true,
      createdAt: new Date(),
    };

    this.customThemes.set(customTheme.id, customTheme);
    this.saveCustomThemes();
    return customTheme;
  }

  deleteCustomTheme(id: string): boolean {
    if (!id.startsWith('custom-')) return false;
    const deleted = this.customThemes.delete(id);
    if (deleted) {
      this.saveCustomThemes();
      if (this.currentThemeId === id) {
        this.setTheme('default');
      }
    }
    return deleted;
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    const colors = theme.colors;

    root.style.setProperty('--violet-500', colors.violet500);
    root.style.setProperty('--violet-600', colors.violet600);
    root.style.setProperty('--cyan-500', colors.cyan500);
    root.style.setProperty('--cyan-600', colors.cyan600);
    root.style.setProperty('--amber-500', colors.amber500);
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-tertiary', colors.bgTertiary);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--glow-violet', colors.glowViolet);
    root.style.setProperty('--glow-cyan', colors.glowCyan);
  }

  private loadTheme(): void {
    try {
      const saved = localStorage.getItem('dlx-theme');
      if (saved) {
        this.currentThemeId = saved;
        const theme = this.getTheme(saved);
        if (theme) {
          this.applyTheme(theme);
        }
      } else {
        this.applyTheme(DEFAULT_THEME);
      }

      // Load custom themes
      const customThemesJson = localStorage.getItem('dlx-custom-themes');
      if (customThemesJson) {
        const customThemes = JSON.parse(customThemesJson);
        customThemes.forEach((theme: CustomTheme) => {
          theme.createdAt = new Date(theme.createdAt);
          this.customThemes.set(theme.id, theme);
        });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      this.applyTheme(DEFAULT_THEME);
    }
  }

  private saveTheme(): void {
    try {
      localStorage.setItem('dlx-theme', this.currentThemeId);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  private saveCustomThemes(): void {
    try {
      const customThemes = Array.from(this.customThemes.values());
      localStorage.setItem('dlx-custom-themes', JSON.stringify(customThemes));
    } catch (error) {
      console.error('Failed to save custom themes:', error);
    }
  }
}

export const themeService = ThemeService.getInstance();

