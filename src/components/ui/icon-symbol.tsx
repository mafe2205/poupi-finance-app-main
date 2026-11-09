import type { AndroidSymbol } from 'expo-symbols';
import { SymbolView, SymbolWeight } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { ColorValue } from 'react-native';

type IconSymbolProps = {
  ios: SFSymbol;
  android: AndroidSymbol;
  size?: number;
  color: ColorValue;
  weight?: SymbolWeight;
};

export function IconSymbol({ ios, android, size = 20, color, weight }: IconSymbolProps) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color}
      weight={weight}
    />
  );
}
