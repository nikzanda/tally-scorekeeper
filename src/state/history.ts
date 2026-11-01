import { displayName } from './gameReducer';
import { isInteger, isRecord, isWinCondition, parsePlayer } from './serialization';
import type { GameState, Player, WinCondition } from './types';

/** Bump when the persisted shape changes incompatibly. */
export const HISTORY_STORAGE_VERSION = 1;
export const MAX_RECORDS = 500;

export type GameRecord = {
  id: string;
  startedAt: number | null;
  endedAt: number;
  rounds: number;
  winCondition: WinCondition;
  /** Players in turn order with their final scores and the names shown at the end. */
  players: Player[];
};

/** A game is worth saving once somebody has scored. */
export function canSaveGame(state: GameState): boolean {
  return state.history.length > 0 || state.players.some((player) => player.score !== 0);
}

export function createGameRecord(state: GameState, id: string, endedAt: number): GameRecord {
  return {
    id,
    startedAt: state.startedAt,
    endedAt,
    rounds: state.round,
    winCondition: state.winCondition,
    players: state.players.map((player, index) => ({
      ...player,
      name: displayName(player, index),
    })),
  };
}

/** Merges two lists, newest first, dropping duplicates and the oldest records over the limit. */
export function mergeRecords(a: readonly GameRecord[], b: readonly GameRecord[]): GameRecord[] {
  const byId = new Map<string, GameRecord>();
  for (const record of [...a, ...b]) {
    if (!byId.has(record.id)) byId.set(record.id, record);
  }
  return [...byId.values()].sort((x, y) => y.endedAt - x.endedAt).slice(0, MAX_RECORDS);
}

export function serializeHistory(records: readonly GameRecord[]): string {
  return JSON.stringify({ version: HISTORY_STORAGE_VERSION, records });
}

function parseRecord(value: unknown): GameRecord | null {
  if (!isRecord(value)) return null;
  const { id, startedAt, endedAt, rounds, winCondition, players: rawPlayers } = value;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof endedAt !== 'number' || !Number.isFinite(endedAt)) return null;
  if (startedAt !== null && (typeof startedAt !== 'number' || !Number.isFinite(startedAt))) {
    return null;
  }
  if (!isInteger(rounds) || rounds < 1 || !isWinCondition(winCondition)) return null;
  if (!Array.isArray(rawPlayers) || rawPlayers.length === 0) return null;
  const players = rawPlayers.map(parsePlayer);
  if (players.some((player) => player === null)) return null;
  return { id, startedAt, endedAt, rounds, winCondition, players: players as Player[] };
}

/** Parses persisted history, skipping corrupted records instead of discarding everything. */
export function deserializeHistory(raw: string | null): GameRecord[] {
  if (!raw) return [];
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return [];
  }
  if (
    !isRecord(payload) ||
    payload.version !== HISTORY_STORAGE_VERSION ||
    !Array.isArray(payload.records)
  ) {
    return [];
  }
  const records = payload.records
    .map(parseRecord)
    .filter((record): record is GameRecord => record !== null);
  return mergeRecords(records, []);
}
