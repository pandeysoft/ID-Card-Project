import { DefaultTheme } from '@react-navigation/native';

export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  ink: '#101828',
  text: '#344054',
  muted: '#8A94A6',
  border: '#E4E7EC',
  accent: '#2563EB',
  accentSoft: '#EAF1FF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  system: 'System',
};

export const theme = {
  navigation: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      primary: colors.accent,
      text: colors.ink,
      border: colors.border,
    },
  },
};
