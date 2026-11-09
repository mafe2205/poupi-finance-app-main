import Svg, { Circle, Text } from 'react-native-svg';
import type { ColorValue } from 'react-native';

type PoupiLogoProps = {
  size?: number;
  color: ColorValue;
};

export function PoupiLogo({ size = 40, color }: PoupiLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={46} stroke={color} strokeWidth={4} fill="none" />
      <Circle cx={50} cy={50} r={39} stroke={color} strokeWidth={2} fill="none" />
      <Text
        x={50}
        y={70}
        fontSize={54}
        fontWeight="700"
        fontFamily="serif"
        fill={color}
        textAnchor="middle">
        P
      </Text>
    </Svg>
  );
}
