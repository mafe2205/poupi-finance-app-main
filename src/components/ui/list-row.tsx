import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: { ios: SFSymbol; android: AndroidSymbol };
  rightText?: string;
  rightTextColor?: string;
  right?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  onDark?: boolean;
};

const ON_DARK = {
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.8)',
  iconBackground: 'rgba(255,255,255,0.16)',
};

export function ListRow({
  title,
  subtitle,
  icon,
  rightText,
  rightTextColor,
  right,
  onPress,
  showChevron,
  onDark,
}: ListRowProps) {
  const theme = useTheme();
  const textColor = onDark ? ON_DARK.text : theme.text;
  const secondaryColor = onDark ? ON_DARK.textSecondary : theme.textSecondary;

  const content = (
    <View style={styles.row}>
      {icon && (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: onDark ? ON_DARK.iconBackground : theme.backgroundSelected },
          ]}>
          <IconSymbol ios={icon.ios} android={icon.android} size={18} color={textColor} />
        </View>
      )}
      <View style={styles.textWrap}>
        <ThemedText type="default" style={onDark ? { color: textColor } : undefined}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type="small" style={{ color: secondaryColor }}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightText && (
        <ThemedText type="smallBold" style={rightTextColor ? { color: rightTextColor } : undefined}>
          {rightText}
        </ThemedText>
      )}
      {right}
      {showChevron && (
        <IconSymbol ios="chevron.right" android="chevron_right" size={16} color={secondaryColor} />
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
