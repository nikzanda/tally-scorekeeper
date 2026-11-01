import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { readItem, writeItem } from '../utils/storage';
import { deserializeHistory, mergeRecords, serializeHistory, type GameRecord } from './history';

type HistoryContextValue = {
  /** Saved games, newest first. */
  records: GameRecord[];
  isHydrated: boolean;
  addRecord: (record: GameRecord) => void;
  removeRecord: (id: string) => void;
  clearHistory: () => void;
};

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readItem('history')
      .then((raw) => {
        // Merge rather than replace, so a game saved while loading is not lost.
        if (!cancelled) setRecords((current) => mergeRecords(current, deserializeHistory(raw)));
      })
      .catch((error: unknown) => console.warn('Failed to load the game history', error))
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeItem('history', serializeHistory(records)).catch((error: unknown) =>
      console.warn('Failed to save the game history', error),
    );
  }, [records, isHydrated]);

  const addRecord = useCallback(
    (record: GameRecord) => setRecords((current) => mergeRecords([record], current)),
    [],
  );
  const removeRecord = useCallback(
    (id: string) => setRecords((current) => current.filter((record) => record.id !== id)),
    [],
  );
  const clearHistory = useCallback(() => setRecords([]), []);

  const value = useMemo(
    () => ({ records, isHydrated, addRecord, removeRecord, clearHistory }),
    [records, isHydrated, addRecord, removeRecord, clearHistory],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
