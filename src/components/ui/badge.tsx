import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BadgeTone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

const toneColor: Record<BadgeTone, ThemeColor> = {
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  neutral: 'textSecondary',
  primary: 'primary',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const theme = useTheme();
  const color = theme[toneColor[tone]];

  return (
    <View style={[styles.badge, { backgroundColor: withOpacity(color as string) }]}>
      <ThemedText type="small" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

function withOpacity(hex: string) {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  return `${hex}26`;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
