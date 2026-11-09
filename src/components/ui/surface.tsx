import { StyleSheet, View, ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Surface({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View style={[styles.base, { backgroundColor: theme.backgroundElement, borderColor: theme.outline }, style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
