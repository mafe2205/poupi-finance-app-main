import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';
import { formatCompactCurrency } from '@/utils/money';

import { useChartWidth } from './use-chart-width';

export type BarGroup = { label: string; values: number[] };

type BarChartProps = {
  data: BarGroup[];
  colors: string[];
  height?: number;
};

const AXIS_WIDTH = 52;
const LABEL_HEIGHT = 20;
const TOP_PADDING = 8;
const GRID_LINES = 4;

export function BarChart({ data, colors, height = 180 }: BarChartProps) {
  const theme = useTheme();
  const { width, onLayout } = useChartWidth();

  const max = Math.max(1, ...data.flatMap((group) => group.values));
  const plotHeight = height - LABEL_HEIGHT - TOP_PADDING;
  const plotWidth = Math.max(0, width - AXIS_WIDTH);
  const groupWidth = data.length > 0 ? plotWidth / data.length : 0;
  const series = Math.max(1, colors.length);
  const barGap = 2;
  const barWidth = Math.max(2, Math.min(18, (groupWidth * 0.7 - barGap * (series - 1)) / series));
  const labelStep = groupWidth < 34 ? 2 : 1;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
            const value = (max / GRID_LINES) * i;
            const y = TOP_PADDING + plotHeight - (value / max) * plotHeight;
            return (
              <G key={`grid-${i}`}>
                <Line
                  x1={AXIS_WIDTH}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke={theme.backgroundSelected as string}
                  strokeWidth={1}
                />
                <SvgText x={AXIS_WIDTH - 6} y={y + 4} fontSize={10} fill={theme.textSecondary as string} textAnchor="end">
                  {formatCompactCurrency(value)}
                </SvgText>
              </G>
            );
          })}

          {data.map((group, groupIndex) => {
            const groupX = AXIS_WIDTH + groupIndex * groupWidth;
            const barsWidth = series * barWidth + (series - 1) * barGap;
            const startX = groupX + (groupWidth - barsWidth) / 2;
            return (
              <G key={group.label}>
                {group.values.map((value, seriesIndex) => {
                  const barHeight = (value / max) * plotHeight;
                  return (
                    <Rect
                      key={seriesIndex}
                      x={startX + seriesIndex * (barWidth + barGap)}
                      y={TOP_PADDING + plotHeight - barHeight}
                      width={barWidth}
                      height={Math.max(0, barHeight)}
                      rx={2}
                      fill={colors[seriesIndex]}
                    />
                  );
                })}
                {groupIndex % labelStep === 0 && (
                  <SvgText
                    x={groupX + groupWidth / 2}
                    y={height - 4}
                    fontSize={10}
                    fill={theme.textSecondary as string}
                    textAnchor="middle">
                    {group.label}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
