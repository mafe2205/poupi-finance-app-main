import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export function useChartWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.floor(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  return { width, onLayout };
}
