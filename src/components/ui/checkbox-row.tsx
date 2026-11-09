import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CheckboxRowProps = {
  label: string;
  helperText?: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
};

export function CheckboxRow({ label, helperText, checked, onToggle }: CheckboxRowProps) {
  const theme = useTheme();

  return (
    <Pressable style={styles.row} onPress={() => onToggle(!checked)}>
      <View
        style={[
          styles.box,
          { borderColor: theme.border, backgroundColor: checked ? theme.primary : 'transparent' },
        ]}>
        {checked && <IconSymbol ios="checkmark" android="check" size={12} color={theme.onPrimary} />}
      </View>
      <View style={styles.textWrap}>
        <ThemedText type="small">{label}</ThemedText>
        {helperText && (
          <ThemedText type="small" themeColor="textSecondary">
            {helperText}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
});
