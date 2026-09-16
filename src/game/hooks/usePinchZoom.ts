// src/game/hooks/usePinchZoom.ts
// Zoom por pinca no terminal. Persiste por sessao.

import { useRef, useState, useCallback } from 'react';

const MIN_SCALE = 0.8;
const MAX_SCALE = 1.6;

export function usePinchZoom(initial: number) {
  if (initial === undefined) initial = 1;
  const [scale, setScale] = useState(initial);
  const startDistanceRef = useRef(0);
  const startScaleRef = useRef(initial);

  const getDistance = (touches: any[]) => {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2) {
      startDistanceRef.current = getDistance(touches);
      startScaleRef.current = scale;
    }
  }, [scale]);

  const onTouchMove = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2 && startDistanceRef.current > 0) {
      const dist = getDistance(touches);
      const ratio = dist / startDistanceRef.current;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, startScaleRef.current * ratio));
      setScale(next);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    startDistanceRef.current = 0;
  }, []);

  const reset = useCallback(() => setScale(1), []);

  return {
    scale,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    reset,
  };
}
