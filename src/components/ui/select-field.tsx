import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectOption = { label: string; value: string };

type SelectFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

export function SelectField({ label, value, placeholder = 'Selecione', options, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <ThemedText themeColor={selected ? 'text' : 'textSecondary'}>
          {selected?.label ?? placeholder}
        </ThemedText>
        <IconSymbol ios="chevron.down" android="expand_more" size={16} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <ThemedView type="background" style={styles.sheet}>
            <ThemedText type="smallBold" style={styles.sheetTitle}>
              {label}
            </ThemedText>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: theme.border },
                  pressed && styles.optionPressed,
                ]}>
                <ThemedText type={option.value === value ? 'smallBold' : 'default'}>
                  {option.label}
                </ThemedText>
                {option.value === value && (
                  <IconSymbol ios="checkmark" android="check" size={16} color={theme.primary} />
                )}
              </Pressable>
            ))}
          </ThemedView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
    maxHeight: '70%',
  },
  sheetTitle: {
    marginBottom: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  optionPressed: {
    opacity: 0.6,
  },
});
