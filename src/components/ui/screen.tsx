import { HeaderHeightContext } from 'expo-router/react-navigation';
import { PropsWithChildren, useContext } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
  withTabInset?: boolean;
}>;

export function Screen({ scroll = true, contentStyle, withTabInset = false, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const topInset = headerHeight > 0 ? 0 : insets.top;

  const content = (
    <View
      style={[
        styles.inner,
        {
          paddingTop: topInset + Spacing.three,
          paddingBottom: insets.bottom + (withTabInset ? BottomTabInset : 0) + Spacing.four,
        },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <ThemedView style={styles.root}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={headerHeight} style={styles.flex}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {content}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    ...Platform.select({ web: { alignSelf: 'center' } }),
  },
});
