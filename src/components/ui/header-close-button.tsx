import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/use-theme';

export function HeaderCloseButton() {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fechar"
      hitSlop={12}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <IconSymbol ios="xmark" android="close" size={22} color={theme.text} />
    </Pressable>
  );
}
