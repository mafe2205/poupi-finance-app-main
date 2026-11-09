import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

export type ColorSchemeName = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'light',
  setColorScheme: () => {},
});

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>('light');
  const value = useMemo(() => ({ colorScheme, setColorScheme }), [colorScheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
