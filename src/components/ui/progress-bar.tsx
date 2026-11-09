import { StyleSheet, View } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  progress: number;
  tone?: ThemeColor;
};

export function ProgressBar({ progress, tone = 'primary' }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: theme[tone] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
