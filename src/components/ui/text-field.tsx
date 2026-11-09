import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type InputMask, masks } from '@/utils/masks';

type TextFieldProps = TextInputProps & {
  label: string;
  mask?: InputMask;
};

const ZERO_VALUE = /^0+([.,]0*)?$/;

const MASK_KEYBOARD = { currency: 'number-pad', account: 'number-pad', phone: 'phone-pad' } as const;

export function TextField({ label, style, onFocus, onBlur, mask, ...inputProps }: TextFieldProps) {
  const theme = useTheme();
  const [clearedZero, setClearedZero] = useState<string | null>(null);
  const { value } = inputProps;
  const rawOnChangeText = inputProps.onChangeText;
  const onChangeText =
    mask && rawOnChangeText ? (text: string) => rawOnChangeText(masks[mask](text)) : rawOnChangeText;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { backgroundColor: theme.input, borderColor: theme.border, color: theme.text },
          style,
        ]}
        keyboardType={mask ? MASK_KEYBOARD[mask] : undefined}
        {...inputProps}
        onChangeText={onChangeText}
        placeholder={inputProps.placeholder ?? clearedZero ?? (mask === 'currency' ? '0,00' : undefined)}
        onFocus={(event) => {
          if (value && ZERO_VALUE.test(value) && onChangeText) {
            setClearedZero(value);
            onChangeText('');
          }
          onFocus?.(event);
        }}
        onBlur={(event) => {
          if (clearedZero !== null && !value && onChangeText) {
            onChangeText(clearedZero);
          }
          setClearedZero(null);
          onBlur?.(event);
        }}
      />
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
    fontSize: 16,
  },
});
