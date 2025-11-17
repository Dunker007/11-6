/**
 * themeSystemService.ts
 * Theme system for dark/light mode and custom color schemes.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  fonts: ThemeFonts;
  custom: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeFonts {
  body: string;
  heading: string;
  mono: string;
  sizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface ThemePreferences {
  userId: string;
  activeTheme: string;
  autoSwitch: boolean;
  followSystem: boolean;
}

class ThemeSystemService {
  private themes: Theme[] = [];
  private activeTheme?: Theme;
  private preferences = new Map<string, ThemePreferences>();

  initializeThemes(): void {
    // Light theme
    this.themes.push({
      id: 'light',
      name: 'Light',
      mode: 'light',
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fonts: {
        body: 'Inter, system-ui, sans-serif',
        heading: 'Inter, system-ui, sans-serif',
        mono: 'Menlo, Monaco, monospace',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
        },
      },
      custom: false,
    });

    // Dark theme
    this.themes.push({
      id: 'dark',
      name: 'Dark',
      mode: 'dark',
      colors: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa',
      },
      fonts: {
        body: 'Inter, system-ui, sans-serif',
        heading: 'Inter, system-ui, sans-serif',
        mono: 'Menlo, Monaco, monospace',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
        },
      },
      custom: false,
    });

    // Blue theme
    this.themes.push({
      id: 'blue',
      name: 'Ocean Blue',
      mode: 'dark',
      colors: {
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        background: '#0c1a2e',
        surface: '#162a47',
        text: '#f0f9ff',
        textSecondary: '#7dd3fc',
        border: '#1e3a5f',
        success: '#14b8a6',
        warning: '#f59e0b',
        error: '#f43f5e',
        info: '#0ea5e9',
      },
      fonts: {
        body: 'Inter, system-ui, sans-serif',
        heading: 'Inter, system-ui, sans-serif',
        mono: 'Menlo, Monaco, monospace',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
        },
      },
      custom: false,
    });

    this.activeTheme = this.themes[0];
    logger.info('Themes initialized', { count: this.themes.length });
  }

  getThemes(): Theme[] {
    return this.themes;
  }

  getTheme(themeId: string): Theme | undefined {
    return this.themes.find(t => t.id === themeId);
  }

  getActiveTheme(): Theme | undefined {
    return this.activeTheme;
  }

  setActiveTheme(themeId: string, userId?: string): boolean {
    const theme = this.themes.find(t => t.id === themeId);

    if (!theme) {
      logger.error('Theme not found', { themeId });
      return false;
    }

    this.activeTheme = theme;

    if (userId) {
      const prefs = this.preferences.get(userId) || {
        userId,
        activeTheme: themeId,
        autoSwitch: false,
        followSystem: false,
      };
      prefs.activeTheme = themeId;
      this.preferences.set(userId, prefs);
    }

    activityService.logActivity({
      type: 'theme_changed',
      message: `Theme changed to ${theme.name}`,
      metadata: { themeId, userId },
    });

    logger.info('Active theme changed', { themeId, name: theme.name });

    return true;
  }

  createCustomTheme(name: string, baseThemeId: string, colorOverrides: Partial<ThemeColors>): Theme | null {
    const baseTheme = this.themes.find(t => t.id === baseThemeId);

    if (!baseTheme) {
      return null;
    }

    const customTheme: Theme = {
      id: crypto.randomUUID(),
      name,
      mode: baseTheme.mode,
      colors: {
        ...baseTheme.colors,
        ...colorOverrides,
      },
      fonts: { ...baseTheme.fonts },
      custom: true,
    };

    this.themes.push(customTheme);

    logger.info('Custom theme created', { id: customTheme.id, name });

    return customTheme;
  }

  deleteCustomTheme(themeId: string): boolean {
    const index = this.themes.findIndex(t => t.id === themeId && t.custom);

    if (index === -1) {
      return false;
    }

    this.themes.splice(index, 1);
    logger.info('Custom theme deleted', { themeId });

    return true;
  }

  toggleMode(userId?: string): Theme {
    const currentMode = this.activeTheme?.mode || 'light';
    const newMode = currentMode === 'light' ? 'dark' : 'light';

    const newTheme = this.themes.find(t => t.mode === newMode && !t.custom);

    if (newTheme) {
      this.setActiveTheme(newTheme.id, userId);
      return newTheme;
    }

    return this.activeTheme!;
  }

  setPreferences(userId: string, prefs: Partial<ThemePreferences>): void {
    const existing = this.preferences.get(userId) || {
      userId,
      activeTheme: this.activeTheme?.id || 'light',
      autoSwitch: false,
      followSystem: false,
    };

    this.preferences.set(userId, { ...existing, ...prefs });
    logger.info('Theme preferences updated', { userId });
  }

  getPreferences(userId: string): ThemePreferences | undefined {
    return this.preferences.get(userId);
  }

  exportTheme(themeId: string): string {
    const theme = this.themes.find(t => t.id === themeId);

    if (!theme) {
      return '';
    }

    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeJson: string): Theme | null {
    try {
      const theme: Theme = JSON.parse(themeJson);
      theme.id = crypto.randomUUID(); // Generate new ID
      theme.custom = true;

      this.themes.push(theme);

      logger.info('Theme imported', { id: theme.id, name: theme.name });

      return theme;
    } catch (error) {
      logger.error('Theme import failed', { error });
      return null;
    }
  }

  generateCSSVariables(theme: Theme): string {
    const vars = [
      `--color-primary: ${theme.colors.primary};`,
      `--color-secondary: ${theme.colors.secondary};`,
      `--color-background: ${theme.colors.background};`,
      `--color-surface: ${theme.colors.surface};`,
      `--color-text: ${theme.colors.text};`,
      `--color-text-secondary: ${theme.colors.textSecondary};`,
      `--color-border: ${theme.colors.border};`,
      `--color-success: ${theme.colors.success};`,
      `--color-warning: ${theme.colors.warning};`,
      `--color-error: ${theme.colors.error};`,
      `--color-info: ${theme.colors.info};`,
      `--font-body: ${theme.fonts.body};`,
      `--font-heading: ${theme.fonts.heading};`,
      `--font-mono: ${theme.fonts.mono};`,
    ];

    return `:root {\n  ${vars.join('\n  ')}\n}`;
  }

  quickTest() {
    this.initializeThemes();

    const userId = 'test-user';

    // Test theme switching
    this.setActiveTheme('dark', userId);

    // Create custom theme
    const customTheme = this.createCustomTheme('Purple Haze', 'dark', {
      primary: '#a855f7',
      secondary: '#ec4899',
    });

    // Toggle mode
    this.toggleMode(userId);

    // Set preferences
    this.setPreferences(userId, {
      autoSwitch: true,
      followSystem: true,
    });

    const cssVars = this.generateCSSVariables(this.activeTheme!);

    return {
      themes: this.themes.map(t => ({ id: t.id, name: t.name, mode: t.mode, custom: t.custom })),
      activeTheme: this.activeTheme,
      customTheme,
      preferences: this.getPreferences(userId),
      cssVariables: cssVars.substring(0, 200) + '...',
    };
  }
}

export const themeSystemService = new ThemeSystemService();
if (typeof window !== 'undefined') (window as any).testThemeSystem = () => themeSystemService.quickTest();
