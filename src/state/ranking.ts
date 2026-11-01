import type { WinCondition } from './types';

type Scored = { id: string; score: number };

export type RankedEntry<T extends Scored> = {
  item: T;
  /** 1-based position; tied scores share the same position (1, 1, 3). */
  position: number;
};

const compareScores = (winCondition: WinCondition) => (a: Scored, b: Scored) =>
  winCondition === 'highest' ? b.score - a.score : a.score - b.score;

/** Sorts from winner to last, keeping the turn order among tied players. */
export function rankPlayers<T extends Scored>(
  players: readonly T[],
  winCondition: WinCondition,
): RankedEntry<T>[] {
  const sorted = [...players].sort(compareScores(winCondition));
  let position = 0;
  return sorted.map((item, index) => {
    if (index === 0 || item.score !== sorted[index - 1].score) position = index + 1;
    return { item, position };
  });
}

/** Ids of the players currently winning; empty when everybody is tied. */
export function getLeaderIds(players: readonly Scored[], winCondition: WinCondition): Set<string> {
  if (players.length < 2) return new Set();
  const scores = players.map((player) => player.score);
  const best = winCondition === 'highest' ? Math.max(...scores) : Math.min(...scores);
  if (scores.every((score) => score === best)) return new Set();
  return new Set(players.filter((player) => player.score === best).map((player) => player.id));
}
