/// <reference types="jest" />

import {
  MAX_PLAYERS,
  SCORE_MERGE_WINDOW_MS,
  createInitialState,
  gameReducer,
  getCurrentPlayerIndex,
} from '../gameReducer';
import type { GameAction, GameState } from '../types';

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const ids = (state: GameState) => state.players.map((player) => player.id);
const scores = (state: GameState) => state.players.map((player) => player.score);

describe('createInitialState', () => {
  it('creates default players with distinct names and colors', () => {
    const state = createInitialState(['a', 'b', 'c']);
    expect(state.players.map((player) => player.name)).toEqual([
      'Giocatore 1',
      'Giocatore 2',
      'Giocatore 3',
    ]);
    expect(new Set(state.players.map((player) => player.color)).size).toBe(3);
    expect(state.currentPlayerId).toBe('a');
    expect(state.round).toBe(1);
  });
});

describe('players', () => {
  it('adds players up to the maximum with unused default names', () => {
    let state = run(createInitialState(['a', 'b']), { type: 'removePlayer', id: 'a' });
    state = run(state, { type: 'addPlayer', id: 'c' });
    expect(state.players.map((player) => player.name)).toEqual(['Giocatore 2', 'Giocatore 3']);

    for (let i = 0; i < MAX_PLAYERS + 5; i += 1) {
      state = gameReducer(state, { type: 'addPlayer', id: `extra-${i}` });
    }
    expect(state.players).toHaveLength(MAX_PLAYERS);
  });

  it('ignores duplicate ids', () => {
    const state = createInitialState(['a', 'b']);
    expect(gameReducer(state, { type: 'addPlayer', id: 'a' })).toBe(state);
  });

  it('never removes the last player', () => {
    const state = run(createInitialState(['a', 'b']), { type: 'removePlayer', id: 'a' });
    expect(gameReducer(state, { type: 'removePlayer', id: 'b' })).toBe(state);
  });

  it('passes the turn to the following player when the current one is removed', () => {
    let state = run(createInitialState(['a', 'b', 'c']), { type: 'nextTurn' });
    expect(state.currentPlayerId).toBe('b');
    state = gameReducer(state, { type: 'removePlayer', id: 'b' });
    expect(state.currentPlayerId).toBe('c');

    state = gameReducer(state, { type: 'removePlayer', id: 'c' });
    expect(state.currentPlayerId).toBe('a');
  });

  it('drops the history of removed players', () => {
    const state = run(
      createInitialState(['a', 'b']),
      { type: 'changeScore', id: 'a', delta: 3, at: 0 },
      { type: 'changeScore', id: 'b', delta: 2, at: 10_000 },
      { type: 'removePlayer', id: 'b' },
    );
    expect(state.history).toEqual([{ playerId: 'a', delta: 3, at: 0 }]);
  });

  it('renames and truncates long names', () => {
    const state = run(createInitialState(['a']), {
      type: 'renamePlayer',
      id: 'a',
      name: 'x'.repeat(100),
    });
    expect(state.players[0].name).toHaveLength(24);
  });

  it('normalizes colors and rejects invalid ones', () => {
    const state = run(createInitialState(['a']), { type: 'setPlayerColor', id: 'a', color: '#0f0' });
    expect(state.players[0].color).toBe('#00FF00');
    expect(gameReducer(state, { type: 'setPlayerColor', id: 'a', color: 'green' })).toBe(state);
  });
});

describe('order', () => {
  it('moves a player and keeps the current turn on the same player', () => {
    const state = run(
      createInitialState(['a', 'b', 'c']),
      { type: 'nextTurn' },
      { type: 'movePlayer', from: 1, to: 0 },
    );
    expect(ids(state)).toEqual(['b', 'a', 'c']);
    expect(state.currentPlayerId).toBe('b');
    expect(getCurrentPlayerIndex(state)).toBe(0);
  });

  it('ignores out of range moves', () => {
    const state = createInitialState(['a', 'b']);
    expect(gameReducer(state, { type: 'movePlayer', from: 0, to: 5 })).toBe(state);
  });

  it('applies a full permutation and gives the turn to the new first player', () => {
    const state = run(createInitialState(['a', 'b', 'c']), {
      type: 'setOrder',
      ids: ['c', 'a', 'b'],
    });
    expect(ids(state)).toEqual(['c', 'a', 'b']);
    expect(state.currentPlayerId).toBe('c');
  });

  it('rejects orders that are not a permutation of the players', () => {
    const state = createInitialState(['a', 'b', 'c']);
    expect(gameReducer(state, { type: 'setOrder', ids: ['a', 'b'] })).toBe(state);
    expect(gameReducer(state, { type: 'setOrder', ids: ['a', 'a', 'b'] })).toBe(state);
    expect(gameReducer(state, { type: 'setOrder', ids: ['a', 'b', 'x'] })).toBe(state);
  });
});

describe('scores', () => {
  it('adds and subtracts points, allowing negative scores', () => {
    const state = run(
      createInitialState(['a', 'b']),
      { type: 'changeScore', id: 'a', delta: 5, at: 0 },
      { type: 'changeScore', id: 'b', delta: -3, at: 10_000 },
    );
    expect(scores(state)).toEqual([5, -3]);
  });

  it('ignores zero deltas and unknown players', () => {
    const state = createInitialState(['a']);
    expect(gameReducer(state, { type: 'changeScore', id: 'a', delta: 0, at: 0 })).toBe(state);
    expect(gameReducer(state, { type: 'changeScore', id: 'x', delta: 1, at: 0 })).toBe(state);
  });

  it('merges rapid changes of the same player into a single undo step', () => {
    let state = run(
      createInitialState(['a', 'b']),
      { type: 'changeScore', id: 'a', delta: 1, at: 0 },
      { type: 'changeScore', id: 'a', delta: 1, at: 500 },
      { type: 'changeScore', id: 'a', delta: 1, at: 1000 },
    );
    expect(state.history).toHaveLength(1);
    expect(state.history[0].delta).toBe(3);

    state = gameReducer(state, {
      type: 'changeScore',
      id: 'a',
      delta: 1,
      at: 1000 + SCORE_MERGE_WINDOW_MS + 1,
    });
    expect(state.history).toHaveLength(2);

    state = gameReducer(state, { type: 'undo' });
    expect(scores(state)).toEqual([3, 0]);
    state = gameReducer(state, { type: 'undo' });
    expect(scores(state)).toEqual([0, 0]);
    expect(gameReducer(state, { type: 'undo' })).toBe(state);
  });

  it('removes merged events that cancel out', () => {
    const state = run(
      createInitialState(['a']),
      { type: 'changeScore', id: 'a', delta: 1, at: 0 },
      { type: 'changeScore', id: 'a', delta: -1, at: 100 },
    );
    expect(state.history).toEqual([]);
  });

  it('does not merge changes of different players', () => {
    const state = run(
      createInitialState(['a', 'b']),
      { type: 'changeScore', id: 'a', delta: 1, at: 0 },
      { type: 'changeScore', id: 'b', delta: 1, at: 100 },
      { type: 'undo' },
    );
    expect(scores(state)).toEqual([1, 0]);
  });

  it('resets scores, history, round and turn', () => {
    const state = run(
      createInitialState(['a', 'b']),
      { type: 'changeScore', id: 'a', delta: 7, at: 0 },
      { type: 'nextTurn' },
      { type: 'nextTurn' },
      { type: 'nextTurn' },
      { type: 'resetScores' },
    );
    expect(scores(state)).toEqual([0, 0]);
    expect(state.history).toEqual([]);
    expect(state.round).toBe(1);
    expect(state.currentPlayerId).toBe('a');
  });

  it('records when the game started and resets it for a new game', () => {
    let state = createInitialState(['a', 'b']);
    expect(state.startedAt).toBeNull();
    state = run(
      state,
      { type: 'changeScore', id: 'a', delta: 1, at: 5_000 },
      { type: 'changeScore', id: 'b', delta: 1, at: 60_000 },
    );
    expect(state.startedAt).toBe(5_000);
    expect(gameReducer(state, { type: 'resetScores' }).startedAt).toBeNull();
  });
});

describe('win condition', () => {
  it('defaults to the highest score and survives a new game', () => {
    let state = createInitialState(['a']);
    expect(state.winCondition).toBe('highest');
    state = run(
      state,
      { type: 'setWinCondition', winCondition: 'lowest' },
      { type: 'resetScores' },
    );
    expect(state.winCondition).toBe('lowest');
    expect(gameReducer(state, { type: 'setWinCondition', winCondition: 'lowest' })).toBe(state);
  });
});

describe('turns', () => {
  it('advances the round when the turn wraps around', () => {
    let state = createInitialState(['a', 'b']);
    state = gameReducer(state, { type: 'nextTurn' });
    expect([state.currentPlayerId, state.round]).toEqual(['b', 1]);
    state = gameReducer(state, { type: 'nextTurn' });
    expect([state.currentPlayerId, state.round]).toEqual(['a', 2]);
  });

  it('goes back across rounds but not before the first turn', () => {
    let state = run(createInitialState(['a', 'b']), { type: 'nextTurn' }, { type: 'nextTurn' });
    state = gameReducer(state, { type: 'previousTurn' });
    expect([state.currentPlayerId, state.round]).toEqual(['b', 1]);
    state = gameReducer(state, { type: 'previousTurn' });
    expect([state.currentPlayerId, state.round]).toEqual(['a', 1]);
    expect(gameReducer(state, { type: 'previousTurn' })).toBe(state);
  });
});
