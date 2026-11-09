import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';
import { formatCompactCurrency } from '@/utils/money';

import { useChartWidth } from './use-chart-width';

export type LineSeries = {
  key: string;
  color: string;
  points: (number | null)[];
  dashed?: boolean;
  area?: boolean;
};

type LineChartProps = {
  labels: string[];
  series: LineSeries[];
  height?: number;
  showDots?: boolean;
};

const AXIS_WIDTH = 52;
const LABEL_HEIGHT = 20;
const TOP_PADDING = 10;
const GRID_LINES = 4;

/** Values over time — e.g. net worth by month, or cumulative spending in the month. */
export function LineChart({ labels, series, height = 180, showDots = true }: LineChartProps) {
  const theme = useTheme();
  const { width, onLayout } = useChartWidth();

  const values = series.flatMap((s) => s.points.filter((p): p is number => p != null));
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(1, ...values);
  const span = rawMax - rawMin || 1;
  const plotHeight = height - LABEL_HEIGHT - TOP_PADDING;
  const plotWidth = Math.max(0, width - AXIS_WIDTH - 8);
  const count = Math.max(1, labels.length - 1);

  const xAt = (i: number) => AXIS_WIDTH + (i / count) * plotWidth;
  const yAt = (v: number) => TOP_PADDING + plotHeight - ((v - rawMin) / span) * plotHeight;

  // Show at most ~6 x labels so they don't overlap.
  const labelStep = Math.max(1, Math.ceil(labels.length / 6));

  function linePath(points: (number | null)[]) {
    let d = '';
    let pen = false;
    points.forEach((p, i) => {
      if (p == null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'} ${xAt(i)} ${yAt(p)} `;
      pen = true;
    });
    return d.trim();
  }

  function areaPath(points: (number | null)[]) {
    const indexed = points.map((p, i) => ({ p, i })).filter((x): x is { p: number; i: number } => x.p != null);
    if (indexed.length < 2) return '';
    const baseline = yAt(Math.max(rawMin, 0));
    const top = indexed.map(({ p, i }) => `L ${xAt(i)} ${yAt(p)}`).join(' ');
    const first = indexed[0];
    const last = indexed[indexed.length - 1];
    return `M ${xAt(first.i)} ${baseline} ${top} L ${xAt(last.i)} ${baseline} Z`;
  }

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
            const value = rawMin + (span / GRID_LINES) * i;
            const y = yAt(value);
            return (
              <G key={`grid-${i}`}>
                <Line x1={AXIS_WIDTH} x2={width} y1={y} y2={y} stroke={theme.backgroundSelected as string} strokeWidth={1} />
                <SvgText x={AXIS_WIDTH - 6} y={y + 4} fontSize={10} fill={theme.textSecondary as string} textAnchor="end">
                  {formatCompactCurrency(value)}
                </SvgText>
              </G>
            );
          })}

          {rawMin < 0 && (
            // Zero line, so negative values read as negative.
            <Line x1={AXIS_WIDTH} x2={width} y1={yAt(0)} y2={yAt(0)} stroke={theme.textSecondary as string} strokeWidth={1} />
          )}

          {series.map((s) => (
            <G key={s.key}>
              {s.area && <Path d={areaPath(s.points)} fill={s.color} fillOpacity={0.12} />}
              <Path
                d={linePath(s.points)}
                stroke={s.color}
                strokeWidth={2}
                fill="none"
                strokeDasharray={s.dashed ? '5 4' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </G>
          ))}

          {showDots &&
            labels.length <= 13 &&
            series[0]?.points.map((p, i) =>
              p == null ? null : (
                <Circle
                  key={`dot-${i}`}
                  cx={xAt(i)}
                  cy={yAt(p)}
                  r={3}
                  fill={theme.backgroundElement as string}
                  stroke={series[0].color}
                  strokeWidth={2}
                />
              )
            )}

          {labels.map((label, i) =>
            i % labelStep === 0 || i === labels.length - 1 ? (
              <SvgText
                key={`label-${i}`}
                x={xAt(i)}
                y={height - 4}
                fontSize={10}
                fill={theme.textSecondary as string}
                textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
                {label}
              </SvgText>
            ) : null
          )}
        </Svg>
      )}
    </View>
  );
}
