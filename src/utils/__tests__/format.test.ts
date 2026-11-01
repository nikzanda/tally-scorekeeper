/// <reference types="jest" />

import { formatDuration, roundsLabel } from '../format';

describe('formatDuration', () => {
  it.each([
    [0, '< 1 min'],
    [59_999, '< 1 min'],
    [60_000, '1 min'],
    [38 * 60_000 + 30_000, '38 min'],
    [65 * 60_000, '1 h 05 min'],
    [-5, '< 1 min'],
  ])('formats %p ms as %p', (milliseconds, expected) => {
    expect(formatDuration(milliseconds)).toBe(expected);
  });
});

describe('roundsLabel', () => {
  it('uses the singular for one round', () => {
    expect(roundsLabel(1)).toBe('1 giro');
    expect(roundsLabel(4)).toBe('4 giri');
  });
});
