import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

export type DonutSegment = { key: string; value: number; color: string };

type DonutChartProps = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
};

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

// One ring slice from startAngle to endAngle (radians, 0 = 3 o'clock, clockwise).
function arcPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number) {
  const large = end - start > Math.PI ? 1 : 0;
  const o1 = polar(cx, cy, outer, start);
  const o2 = polar(cx, cy, outer, end);
  const i1 = polar(cx, cy, inner, end);
  const i2 = polar(cx, cy, inner, start);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
}

/** Share of a whole — e.g. expenses by category. A 1.5° gap separates adjacent slices. */
export function DonutChart({ segments, size = 168, thickness = 26, centerLabel, centerValue }: DonutChartProps) {
  const theme = useTheme();
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2;
  const inner = outer - thickness;
  const gap = segments.length > 1 ? (1.5 * Math.PI) / 180 : 0;

  // Each slice starts where the previous one ended, from 12 o'clock.
  const positive = segments.filter((s) => s.value > 0);
  const slices = positive.map((segment, index) => {
    const before = positive.slice(0, index).reduce((sum, s) => sum + s.value, 0);
    const start = -Math.PI / 2 + (before / total) * Math.PI * 2;
    const end = start + (segment.value / total) * Math.PI * 2;
    return { ...segment, start: start + gap / 2, end: end - gap / 2 };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {total <= 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={outer - thickness / 2}
            stroke={theme.backgroundSelected as string}
            strokeWidth={thickness}
            fill="none"
          />
        )}
        {slices.length === 1 ? (
          // A full 360° arc can't be drawn as a path: use a ring instead.
          <Circle
            cx={cx}
            cy={cy}
            r={outer - thickness / 2}
            stroke={slices[0].color}
            strokeWidth={thickness}
            fill="none"
          />
        ) : (
          slices.map((slice) => (
            <Path key={slice.key} d={arcPath(cx, cy, outer, inner, slice.start, slice.end)} fill={slice.color} />
          ))
        )}
        {!!centerValue && (
          <SvgText
            x={cx}
            y={cy + (centerLabel ? 2 : 5)}
            fontSize={15}
            fontWeight="600"
            fill={theme.text as string}
            textAnchor="middle">
            {centerValue}
          </SvgText>
        )}
        {!!centerLabel && (
          <SvgText x={cx} y={cy + 18} fontSize={10} fill={theme.textSecondary as string} textAnchor="middle">
            {centerLabel}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
