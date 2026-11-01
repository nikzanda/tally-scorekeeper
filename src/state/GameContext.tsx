import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { readItem, writeItem } from '../utils/storage';
import { createId, createInitialState, gameReducer } from './gameReducer';
import { deserializeGame, serializeGame } from './serialization';
import type { GameState, WinCondition } from './types';

const SAVE_DEBOUNCE_MS = 300;

export type GameActions = {
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;
  setPlayerColor: (id: string, color: string) => void;
  movePlayer: (from: number, to: number) => void;
  /** Randomizes the turn order; the new first player gets the turn. */
  shufflePlayers: () => void;
  setWinCondition: (winCondition: WinCondition) => void;
  changeScore: (id: string, delta: number) => void;
  undo: () => void;
  /** Starts a new game with the same players: scores, turn, round and undo history are reset. */
  resetScores: () => void;
  nextTurn: () => void;
  previousTurn: () => void;
};

type GameContextValue = {
  state: GameState;
  actions: GameActions;
  /** False until the saved game (if any) has been loaded from storage. */
  isHydrated: boolean;
};

const GameContext = createContext<GameContextValue | null>(null);

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function persist(state: GameState): Promise<void> {
  try {
    await writeItem('game', serializeGame(state));
  } catch (error) {
    console.warn('Failed to save the game', error);
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState());
  const [isHydrated, setIsHydrated] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    let cancelled = false;
    readItem('game')
      .then((raw) => {
        const saved = deserializeGame(raw);
        if (!cancelled && saved) dispatch({ type: 'hydrate', state: saved });
      })
      .catch((error: unknown) => console.warn('Failed to load the saved game', error))
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (!isHydrated) return;
    const timeout = setTimeout(() => void persist(state), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [state, isHydrated]);

  // Flush immediately when the app goes to background, so a pending debounced save is not lost.
  useEffect(() => {
    if (!isHydrated) return;
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') void persist(stateRef.current);
    });
    return () => subscription.remove();
  }, [isHydrated]);

  const actions = useMemo<GameActions>(
    () => ({
      addPlayer: () => dispatch({ type: 'addPlayer', id: createId() }),
      removePlayer: (id) => dispatch({ type: 'removePlayer', id }),
      renamePlayer: (id, name) => dispatch({ type: 'renamePlayer', id, name }),
      setPlayerColor: (id, color) => dispatch({ type: 'setPlayerColor', id, color }),
      movePlayer: (from, to) => dispatch({ type: 'movePlayer', from, to }),
      shufflePlayers: () =>
        dispatch({
          type: 'setOrder',
          ids: shuffled(stateRef.current.players.map((player) => player.id)),
        }),
      setWinCondition: (winCondition) => dispatch({ type: 'setWinCondition', winCondition }),
      changeScore: (id, delta) => dispatch({ type: 'changeScore', id, delta, at: Date.now() }),
      undo: () => dispatch({ type: 'undo' }),
      resetScores: () => dispatch({ type: 'resetScores' }),
      nextTurn: () => dispatch({ type: 'nextTurn' }),
      previousTurn: () => dispatch({ type: 'previousTurn' }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, actions, isHydrated }), [state, actions, isHydrated]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
