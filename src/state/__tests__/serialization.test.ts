/// <reference types="jest" />

import { createInitialState, gameReducer } from '../gameReducer';
import { STORAGE_VERSION, deserializeGame, serializeGame } from '../serialization';

describe('game serialization', () => {
  it('round-trips a game', () => {
    const state = gameReducer(createInitialState(['a', 'b']), {
      type: 'changeScore',
      id: 'b',
      delta: 12,
      at: 1,
    });
    expect(deserializeGame(serializeGame(state))).toEqual(state);
  });

  it.each([
    ['missing data', null],
    ['invalid json', '{'],
    ['another version', JSON.stringify({ version: STORAGE_VERSION + 1, state: {} })],
    ['no players', JSON.stringify({ version: STORAGE_VERSION, state: { players: [], history: [] } })],
    [
      'invalid player',
      JSON.stringify({
        version: STORAGE_VERSION,
        state: { players: [{ id: 'a', name: 'A', color: 'red', score: 0 }], history: [] },
      }),
    ],
  ])('returns null for %s', (_, raw) => {
    expect(deserializeGame(raw)).toBeNull();
  });

  it('fills fields added later with their defaults when loading older saves', () => {
    const raw = JSON.stringify({
      version: STORAGE_VERSION,
      state: {
        players: [{ id: 'a', name: 'A', color: '#FF0000', score: 3 }],
        currentPlayerId: 'a',
        round: 2,
        history: [],
      },
    });
    expect(deserializeGame(raw)).toMatchObject({ winCondition: 'highest', startedAt: null });
  });

  it('keeps the win condition and start time', () => {
    const state = {
      ...createInitialState(['a']),
      winCondition: 'lowest' as const,
      startedAt: 1_000,
    };
    expect(deserializeGame(serializeGame(state))).toMatchObject({
      winCondition: 'lowest',
      startedAt: 1_000,
    });
  });

  it('repairs an unknown current player, invalid round and stale history', () => {
    const raw = JSON.stringify({
      version: STORAGE_VERSION,
      state: {
        players: [{ id: 'a', name: 'A', color: '#ff0000', score: 3 }],
        currentPlayerId: 'ghost',
        round: -2,
        history: [
          { playerId: 'a', delta: 3, at: 1 },
          { playerId: 'ghost', delta: 1, at: 2 },
        ],
      },
    });
    expect(deserializeGame(raw)).toEqual({
      players: [{ id: 'a', name: 'A', color: '#FF0000', score: 3 }],
      currentPlayerId: 'a',
      round: 1,
      history: [{ playerId: 'a', delta: 3, at: 1 }],
      winCondition: 'highest',
      startedAt: null,
    });
  });
});
