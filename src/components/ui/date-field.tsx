import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

function parseBrDate(value: string): Date | null {
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toBrDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function DateField({ label, value, onChange, placeholder = 'dd/mm/aaaa', minimumDate, maximumDate }: DateFieldProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(new Date());

  if (Platform.OS === 'web') {
    return <TextField label={label} value={value} onChangeText={onChange} placeholder={placeholder} />;
  }

  function openPicker() {
    setDraft(parseBrDate(value) ?? new Date());
    setOpen(true);
  }

  const pickerProps = {
    value: draft,
    mode: 'date' as const,
    minimumDate,
    maximumDate,
    accentColor: theme.primary as string,
    themeVariant: colorScheme === 'dark' ? ('dark' as const) : ('light' as const),
  };

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'nenhuma data'}`}
        onPress={openPicker}
        style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <ThemedText themeColor={value ? 'text' : 'textSecondary'}>{value || placeholder}</ThemedText>
        <IconSymbol ios="calendar" android="calendar_month" size={18} color={theme.textSecondary} />
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          {...pickerProps}
          presentation="dialog"
          positiveButton={{ label: 'OK' }}
          negativeButton={{ label: 'Cancelar' }}
          onValueChange={(_, date) => {
            setOpen(false);
            onChange(toBrDate(date));
          }}
          onDismiss={() => setOpen(false)}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable onPress={() => {}}>
              <ThemedView style={styles.sheet}>
                <DateTimePicker
                  {...pickerProps}
                  display="inline"
                  locale="pt_BR"
                  onValueChange={(_, date) => setDraft(date)}
                />
                <View style={styles.actions}>
                  <Button label="Cancelar" variant="danger" onPress={() => setOpen(false)} style={styles.action} />
                  <Button
                    label="Confirmar"
                    onPress={() => {
                      setOpen(false);
                      onChange(toBrDate(draft));
                    }}
                    style={styles.action}
                  />
                </View>
              </ThemedView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    minHeight: 48,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
