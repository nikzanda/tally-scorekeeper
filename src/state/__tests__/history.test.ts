/// <reference types="jest" />

import { createInitialState, gameReducer } from '../gameReducer';
import {
  HISTORY_STORAGE_VERSION,
  MAX_RECORDS,
  canSaveGame,
  createGameRecord,
  deserializeHistory,
  mergeRecords,
  serializeHistory,
  type GameRecord,
} from '../history';
import type { GameAction } from '../types';

const record = (id: string, endedAt: number): GameRecord => ({
  id,
  startedAt: endedAt - 60_000,
  endedAt,
  rounds: 3,
  winCondition: 'highest',
  players: [{ id: 'p1', name: 'Anna', color: '#1E88E5', score: 12 }],
});

describe('canSaveGame', () => {
  it('is false until somebody scores and after every change is undone', () => {
    let state = createInitialState(['a', 'b']);
    expect(canSaveGame(state)).toBe(false);
    state = gameReducer(state, { type: 'changeScore', id: 'a', delta: 2, at: 0 });
    expect(canSaveGame(state)).toBe(true);
    state = gameReducer(state, { type: 'undo' });
    expect(canSaveGame(state)).toBe(false);
  });
});

describe('createGameRecord', () => {
  it('captures the final scores with the displayed names', () => {
    const actions: GameAction[] = [
      { type: 'renamePlayer', id: 'a', name: '  ' },
      { type: 'renamePlayer', id: 'b', name: 'Luca' },
      { type: 'setWinCondition', winCondition: 'lowest' },
      { type: 'changeScore', id: 'b', delta: 7, at: 1_000 },
      { type: 'nextTurn' },
      { type: 'nextTurn' },
    ];
    const state = actions.reduce(gameReducer, createInitialState(['a', 'b']));

    expect(createGameRecord(state, 'r1', 5_000)).toEqual({
      id: 'r1',
      startedAt: 1_000,
      endedAt: 5_000,
      rounds: 2,
      winCondition: 'lowest',
      players: [
        { id: 'a', name: 'Giocatore 1', color: state.players[0].color, score: 0 },
        { id: 'b', name: 'Luca', color: state.players[1].color, score: 7 },
      ],
    });
  });
});

describe('mergeRecords', () => {
  it('sorts newest first and drops duplicates', () => {
    const merged = mergeRecords([record('x', 2), record('y', 3)], [record('x', 99), record('z', 1)]);
    expect(merged.map((item) => item.id)).toEqual(['y', 'x', 'z']);
  });

  it('keeps only the newest records over the limit', () => {
    const many = Array.from({ length: MAX_RECORDS + 5 }, (_, index) => record(`r${index}`, index));
    const merged = mergeRecords(many, []);
    expect(merged).toHaveLength(MAX_RECORDS);
    expect(merged[merged.length - 1].id).toBe('r5');
  });
});

describe('history serialization', () => {
  it('round-trips the records', () => {
    const records = [record('b', 20), record('a', 10)];
    expect(deserializeHistory(serializeHistory(records))).toEqual(records);
  });

  it('skips corrupted records and ignores unreadable data', () => {
    const raw = JSON.stringify({
      version: HISTORY_STORAGE_VERSION,
      records: [record('ok', 1), { id: 'bad', players: [] }, null],
    });
    expect(deserializeHistory(raw).map((item) => item.id)).toEqual(['ok']);
    expect(deserializeHistory(null)).toEqual([]);
    expect(deserializeHistory('{')).toEqual([]);
    expect(deserializeHistory(JSON.stringify({ version: 99, records: [] }))).toEqual([]);
  });
});
