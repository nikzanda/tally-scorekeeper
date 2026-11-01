export type Player = {
  id: string;
  name: string;
  /** Normalized `#RRGGBB` color. */
  color: string;
  score: number;
};

/** Whether the highest or the lowest score wins the game. */
export type WinCondition = 'highest' | 'lowest';

export type ScoreEvent = {
  playerId: string;
  delta: number;
  /** Epoch milliseconds of the latest change merged into this event. */
  at: number;
};

export type GameState = {
  /** Players in turn order. */
  players: Player[];
  currentPlayerId: string | null;
  /** 1-based round counter, incremented when the turn wraps to the first player. */
  round: number;
  /** Score changes, oldest first, used for undo. */
  history: ScoreEvent[];
  winCondition: WinCondition;
  /** Epoch milliseconds of the first score change of the game, `null` until then. */
  startedAt: number | null;
};

export type GameAction =
  | { type: 'hydrate'; state: GameState }
  | { type: 'addPlayer'; id: string }
  | { type: 'removePlayer'; id: string }
  | { type: 'renamePlayer'; id: string; name: string }
  | { type: 'setPlayerColor'; id: string; color: string }
  | { type: 'movePlayer'; from: number; to: number }
  | { type: 'setOrder'; ids: string[] }
  | { type: 'setWinCondition'; winCondition: WinCondition }
  | { type: 'changeScore'; id: string; delta: number; at: number }
  | { type: 'undo' }
  | { type: 'resetScores' }
  | { type: 'nextTurn' }
  | { type: 'previousTurn' };
