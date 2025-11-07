export interface Theme {
  id: string;
  name: string;
  description: string;
  mode: 'dark' | 'light' | 'high-contrast';
  colors: ThemeColors;
}

export interface ThemeColors {
  // Primary Colors
  violet500: string;
  violet600: string;
  cyan500: string;
  cyan600: string;
  amber500: string;
  
  // Background
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Effects
  glowViolet: string;
  glowCyan: string;
}

export interface CustomTheme extends Theme {
  isCustom: true;
  createdAt: Date;
}

