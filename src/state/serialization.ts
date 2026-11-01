import { normalizeHex } from '../utils/color';
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS } from './gameReducer';
import type { GameState, Player, ScoreEvent, WinCondition } from './types';

/** Bump when the persisted shape changes incompatibly. */
export const STORAGE_VERSION = 1;

type PersistedGame = { version: number; state: GameState };

export function serializeGame(state: GameState): string {
  const payload: PersistedGame = { version: STORAGE_VERSION, state };
  return JSON.stringify(payload);
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isInteger = (value: unknown): value is number => Number.isSafeInteger(value);

export const isWinCondition = (value: unknown): value is WinCondition =>
  value === 'highest' || value === 'lowest';

export function parsePlayer(value: unknown): Player | null {
  if (!isRecord(value)) return null;
  const { id, name, color, score } = value;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof name !== 'string' || typeof color !== 'string' || !isInteger(score)) return null;
  const normalizedColor = normalizeHex(color);
  if (!normalizedColor) return null;
  return { id, name: name.slice(0, MAX_NAME_LENGTH), color: normalizedColor, score };
}

function parseScoreEvent(value: unknown, playerIds: Set<string>): ScoreEvent | null {
  if (!isRecord(value)) return null;
  const { playerId, delta, at } = value;
  if (typeof playerId !== 'string' || !playerIds.has(playerId)) return null;
  if (!isInteger(delta) || delta === 0 || typeof at !== 'number') return null;
  return { playerId, delta, at };
}

/** Parses persisted data, returning `null` when it is missing, outdated or corrupted. */
export function deserializeGame(raw: string | null): GameState | null {
  if (!raw) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(payload) || payload.version !== STORAGE_VERSION || !isRecord(payload.state)) {
    return null;
  }
  const {
    players: rawPlayers,
    currentPlayerId,
    round,
    history: rawHistory,
    winCondition,
    startedAt,
  } = payload.state;
  if (!Array.isArray(rawPlayers) || !Array.isArray(rawHistory)) return null;

  const players = rawPlayers.map(parsePlayer);
  if (players.some((player) => player === null)) return null;
  const validPlayers = players as Player[];
  const playerIds = new Set(validPlayers.map((player) => player.id));
  if (
    playerIds.size !== validPlayers.length ||
    validPlayers.length < MIN_PLAYERS ||
    validPlayers.length > MAX_PLAYERS
  ) {
    return null;
  }

  const history = rawHistory
    .map((event) => parseScoreEvent(event, playerIds))
    .filter((event): event is ScoreEvent => event !== null);

  return {
    players: validPlayers,
    currentPlayerId:
      typeof currentPlayerId === 'string' && playerIds.has(currentPlayerId)
        ? currentPlayerId
        : validPlayers[0].id,
    round: isInteger(round) && round >= 1 ? round : 1,
    history,
    // Fields added after the first release default to their initial values.
    winCondition: isWinCondition(winCondition) ? winCondition : 'highest',
    startedAt: typeof startedAt === 'number' && Number.isFinite(startedAt) ? startedAt : null,
  };
}
