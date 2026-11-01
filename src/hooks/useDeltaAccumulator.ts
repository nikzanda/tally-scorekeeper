import { useCallback, useEffect, useRef, useState } from 'react';

import { SCORE_MERGE_WINDOW_MS } from '../state/gameReducer';

/**
 * Sums consecutive score changes so the UI can show "+3" while the user taps, clearing it after a
 * pause. The pause matches the reducer's merge window, so the badge equals what "undo" reverts.
 */
export function useDeltaAccumulator(): [number, (delta: number) => void] {
  const [pending, setPending] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback((delta: number) => {
    setPending((current) => current + delta);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setPending(0);
    }, SCORE_MERGE_WINDOW_MS);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  return [pending, push];
}
