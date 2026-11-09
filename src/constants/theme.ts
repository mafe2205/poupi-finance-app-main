import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#ffffff',
    backgroundSelected: '#E6F1FD',
    textSecondary: '#5A5F66',
    primary: '#5AAEFA',
    onPrimary: '#ffffff',
    success: '#1f9254',
    danger: '#e5484d',
    warning: '#b45309',
    border: '#000000',
    input: '#ffffff',
    outline: '#000000',
    surfaceMuted: '#E9ECF1',
    surfaceSubtle: '#F9FAFB',
    dangerSoft: '#FDECEC',
    warningSoft: '#FEF7D6',
    warningStrong: '#CA8A04',
    dangerText: '#B42318',
    warningText: '#854D0E',
    surfaceStrong: '#4B5563',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#3c87f7',
    onPrimary: '#ffffff',
    success: '#3ddc84',
    danger: '#f87171',
    warning: '#fbbf24',
    border: '#2E3135',
    input: '#18191b',
    outline: 'transparent',
    surfaceMuted: '#18191B',
    surfaceSubtle: '#1C1D20',
    dangerSoft: '#3B1A1C',
    warningSoft: '#3A3012',
    warningStrong: '#FACC15',
    dangerText: '#FCA5A5',
    warningText: '#FDE68A',
    surfaceStrong: '#3A3F47',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
