/// <reference types="jest" />

import { getLeaderIds, rankPlayers } from '../ranking';

const players = [
  { id: 'a', score: 10 },
  { id: 'b', score: 25 },
  { id: 'c', score: 10 },
  { id: 'd', score: -3 },
];

const summary = (ranked: ReturnType<typeof rankPlayers>) =>
  ranked.map(({ item, position }) => `${position}:${item.id}`);

describe('rankPlayers', () => {
  it('ranks from the highest score with shared positions for ties', () => {
    expect(summary(rankPlayers(players, 'highest'))).toEqual(['1:b', '2:a', '2:c', '4:d']);
  });

  it('ranks from the lowest score when the lowest wins', () => {
    expect(summary(rankPlayers(players, 'lowest'))).toEqual(['1:d', '2:a', '2:c', '4:b']);
  });

  it('does not mutate the input', () => {
    const copy = [...players];
    rankPlayers(players, 'highest');
    expect(players).toEqual(copy);
  });
});

describe('getLeaderIds', () => {
  it('returns nobody while everybody is tied or alone', () => {
    expect(getLeaderIds([{ id: 'a', score: 0 }, { id: 'b', score: 0 }], 'highest').size).toBe(0);
    expect(getLeaderIds([{ id: 'a', score: 5 }], 'highest').size).toBe(0);
  });

  it('returns every player sharing the best score', () => {
    const scored = [...players, { id: 'e', score: 25 }];
    expect([...getLeaderIds(scored, 'highest')]).toEqual(['b', 'e']);
    expect([...getLeaderIds(scored, 'lowest')]).toEqual(['d']);
  });
});
