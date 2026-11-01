/// <reference types="jest" />

import {
  ASSIGNMENT_ORDER,
  PALETTE,
  contrastRatio,
  getReadableTextColor,
  hexToRgb,
  normalizeHex,
  pickUnusedColor,
  rgbToHex,
  withAlpha,
} from '../color';

describe('normalizeHex', () => {
  it.each([
    ['#1e88e5', '#1E88E5'],
    ['1E88E5', '#1E88E5'],
    ['#abc', '#AABBCC'],
    ['  #ABCDEF  ', '#ABCDEF'],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeHex(input)).toBe(expected);
  });

  it.each(['', '#12', '#12345', '#1234567', '#GGGGGG', 'red'])('rejects %p', (input) => {
    expect(normalizeHex(input)).toBeNull();
  });
});

describe('rgb conversions', () => {
  it('round-trips between hex and rgb', () => {
    expect(hexToRgb('#1E88E5')).toEqual({ r: 30, g: 136, b: 229 });
    expect(rgbToHex({ r: 30, g: 136, b: 229 })).toBe('#1E88E5');
  });

  it('clamps and rounds out of range channels', () => {
    expect(rgbToHex({ r: -10, g: 300, b: 127.6 })).toBe('#00FF80');
  });

  it('throws on invalid hex input', () => {
    expect(() => hexToRgb('nope')).toThrow();
  });

  it('builds rgba strings', () => {
    expect(withAlpha('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });
});

describe('contrast', () => {
  it('computes the WCAG contrast ratio', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('picks dark text on light backgrounds and light text on dark ones', () => {
    expect(getReadableTextColor('#FDD835')).toBe('#141414');
    expect(getReadableTextColor('#FFFFFF')).toBe('#141414');
    expect(getReadableTextColor('#212121')).toBe('#FFFFFF');
    expect(getReadableTextColor('#3949AB')).toBe('#FFFFFF');
  });

  it('prefers light text on near-ties', () => {
    // #E53935 has 4.23:1 with white and 4.36:1 with dark text.
    expect(getReadableTextColor('#E53935')).toBe('#FFFFFF');
  });

  it('keeps every palette color readable', () => {
    for (const color of PALETTE) {
      expect(contrastRatio(color, getReadableTextColor(color))).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('pickUnusedColor', () => {
  it('assigns every palette color exactly once', () => {
    expect([...ASSIGNMENT_ORDER].sort()).toEqual([...PALETTE].sort());
  });

  it('returns the next color not in use', () => {
    expect(pickUnusedColor([])).toBe(ASSIGNMENT_ORDER[0]);
    expect(pickUnusedColor([ASSIGNMENT_ORDER[0].toLowerCase(), ASSIGNMENT_ORDER[1]])).toBe(
      ASSIGNMENT_ORDER[2],
    );
  });

  it('cycles through the colors when every color is taken', () => {
    expect(pickUnusedColor([...PALETTE])).toBe(ASSIGNMENT_ORDER[0]);
  });
});
