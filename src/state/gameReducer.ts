import { normalizeHex, pickUnusedColor } from '../utils/color';
import type { GameAction, GameState, Player, ScoreEvent } from './types';

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 24;
export const HISTORY_LIMIT = 200;
/** Consecutive score changes for the same player within this window are undone together. */
export const SCORE_MERGE_WINDOW_MS = 1500;

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultPlayerName(position: number): string {
  return `Giocatore ${position}`;
}

/** Name to show for a player, falling back to the default name while the field is empty. */
export function displayName(player: Player, index: number): string {
  return player.name.trim() || defaultPlayerName(index + 1);
}

function createDefaultPlayer(players: Player[], id: string): Player {
  const takenNames = new Set(players.map((player) => player.name.trim()));
  let position = players.length + 1;
  while (takenNames.has(defaultPlayerName(position))) position += 1;
  return {
    id,
    name: defaultPlayerName(position),
    color: pickUnusedColor(players.map((player) => player.color)),
    score: 0,
  };
}

export function createInitialState(ids: string[] = [createId(), createId()]): GameState {
  const players = ids.reduce<Player[]>((acc, id) => [...acc, createDefaultPlayer(acc, id)], []);
  return {
    players,
    currentPlayerId: players[0]?.id ?? null,
    round: 1,
    history: [],
    winCondition: 'highest',
    startedAt: null,
  };
}

export function getCurrentPlayerIndex(state: GameState): number {
  const index = state.players.findIndex((player) => player.id === state.currentPlayerId);
  return index === -1 && state.players.length > 0 ? 0 : index;
}

function updatePlayer(state: GameState, id: string, update: (player: Player) => Player): GameState {
  let changed = false;
  const players = state.players.map((player) => {
    if (player.id !== id) return player;
    const next = update(player);
    changed = changed || next !== player;
    return next;
  });
  return changed ? { ...state, players } : state;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function recordScoreEvent(history: ScoreEvent[], event: ScoreEvent): ScoreEvent[] {
  const last = history[history.length - 1];
  if (last && last.playerId === event.playerId && event.at - last.at <= SCORE_MERGE_WINDOW_MS) {
    const merged = { ...last, delta: last.delta + event.delta, at: event.at };
    const rest = history.slice(0, -1);
    return merged.delta === 0 ? rest : [...rest, merged];
  }
  return [...history, event].slice(-HISTORY_LIMIT);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'addPlayer': {
      if (state.players.length >= MAX_PLAYERS) return state;
      if (state.players.some((player) => player.id === action.id)) return state;
      const player = createDefaultPlayer(state.players, action.id);
      return {
        ...state,
        players: [...state.players, player],
        currentPlayerId: state.currentPlayerId ?? player.id,
      };
    }

    case 'removePlayer': {
      const index = state.players.findIndex((player) => player.id === action.id);
      if (index === -1 || state.players.length <= MIN_PLAYERS) return state;
      const players = state.players.filter((player) => player.id !== action.id);
      const currentPlayerId =
        state.currentPlayerId === action.id
          ? players[index % players.length].id
          : state.currentPlayerId;
      return {
        ...state,
        players,
        currentPlayerId,
        history: state.history.filter((event) => event.playerId !== action.id),
      };
    }

    case 'renamePlayer': {
      const name = action.name.slice(0, MAX_NAME_LENGTH);
      return updatePlayer(state, action.id, (player) =>
        player.name === name ? player : { ...player, name },
      );
    }

    case 'setPlayerColor': {
      const color = normalizeHex(action.color);
      if (!color) return state;
      return updatePlayer(state, action.id, (player) =>
        player.color === color ? player : { ...player, color },
      );
    }

    case 'movePlayer': {
      const { from, to } = action;
      const count = state.players.length;
      if (from === to || from < 0 || to < 0 || from >= count || to >= count) return state;
      return { ...state, players: moveItem(state.players, from, to) };
    }

    case 'setOrder': {
      const byId = new Map(state.players.map((player) => [player.id, player]));
      const isPermutation =
        action.ids.length === state.players.length &&
        new Set(action.ids).size === action.ids.length &&
        action.ids.every((id) => byId.has(id));
      if (!isPermutation) return state;
      const players = action.ids.map((id) => byId.get(id)!);
      return { ...state, players, currentPlayerId: players[0]?.id ?? null };
    }

    case 'setWinCondition':
      return state.winCondition === action.winCondition
        ? state
        : { ...state, winCondition: action.winCondition };

    case 'changeScore': {
      const delta = Math.trunc(action.delta);
      if (delta === 0 || !state.players.some((player) => player.id === action.id)) return state;
      const next = updatePlayer(state, action.id, (player) => ({
        ...player,
        score: player.score + delta,
      }));
      return {
        ...next,
        history: recordScoreEvent(state.history, { playerId: action.id, delta, at: action.at }),
        startedAt: state.startedAt ?? action.at,
      };
    }

    case 'undo': {
      const last = state.history[state.history.length - 1];
      if (!last) return state;
      const next = updatePlayer(state, last.playerId, (player) => ({
        ...player,
        score: player.score - last.delta,
      }));
      return { ...next, history: state.history.slice(0, -1) };
    }

    case 'resetScores':
      return {
        ...state,
        players: state.players.map((player) =>
          player.score === 0 ? player : { ...player, score: 0 },
        ),
        currentPlayerId: state.players[0]?.id ?? null,
        round: 1,
        history: [],
        startedAt: null,
      };

    case 'nextTurn': {
      const count = state.players.length;
      if (count === 0) return state;
      const nextIndex = (getCurrentPlayerIndex(state) + 1) % count;
      return {
        ...state,
        currentPlayerId: state.players[nextIndex].id,
        round: nextIndex === 0 ? state.round + 1 : state.round,
      };
    }

    case 'previousTurn': {
      const count = state.players.length;
      if (count === 0) return state;
      const index = getCurrentPlayerIndex(state);
      if (index === 0 && state.round <= 1) return state;
      const previousIndex = (index - 1 + count) % count;
      return {
        ...state,
        currentPlayerId: state.players[previousIndex].id,
        round: index === 0 ? state.round - 1 : state.round,
      };
    }
  }
}
