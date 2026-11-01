export type Rgb = { r: number; g: number; b: number };

/** Curated, mutually distinguishable colors offered in the color picker. */
export const PALETTE: readonly string[] = [
  '#E53935',
  '#D81B60',
  '#8E24AA',
  '#5E35B1',
  '#3949AB',
  '#1E88E5',
  '#039BE5',
  '#00ACC1',
  '#00897B',
  '#43A047',
  '#7CB342',
  '#C0CA33',
  '#FDD835',
  '#FFB300',
  '#FB8C00',
  '#F4511E',
  '#6D4C41',
  '#757575',
  '#546E7A',
  '#212121',
];

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns the color as uppercase `#RRGGBB`, or `null` when it is not a valid 3/6 digit hex color. */
export function normalizeHex(value: string): string | null {
  const match = HEX_PATTERN.exec(value.trim());
  if (!match) return null;
  let digits = match[1];
  if (digits.length === 3) {
    digits = digits
      .split('')
      .map((digit) => digit + digit)
      .join('');
  }
  return `#${digits.toUpperCase()}`;
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const value = parseInt(normalized.slice(1), 16);
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

export function clampChannel(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/** WCAG 2.x relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

export const LIGHT_TEXT = '#FFFFFF';
export const DARK_TEXT = '#141414';

/** Light text looks more natural on saturated colors, so it wins near-ties (within 10%). */
const LIGHT_TEXT_BIAS = 1.1;

/** Picks the text color (light or dark) with the best contrast on the given background. */
export function getReadableTextColor(background: string): string {
  return contrastRatio(background, LIGHT_TEXT) * LIGHT_TEXT_BIAS >=
    contrastRatio(background, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
}

/** Palette colors in the order they are assigned to new players, alternating very different hues. */
export const ASSIGNMENT_ORDER: readonly string[] = [
  '#1E88E5',
  '#E53935',
  '#43A047',
  '#FDD835',
  '#8E24AA',
  '#FB8C00',
  '#00ACC1',
  '#D81B60',
  '#6D4C41',
  '#7CB342',
  '#3949AB',
  '#FFB300',
  '#00897B',
  '#F4511E',
  '#5E35B1',
  '#C0CA33',
  '#039BE5',
  '#757575',
  '#546E7A',
  '#212121',
];

/** Next color for a new player not in `usedColors`; cycles when every color is taken. */
export function pickUnusedColor(usedColors: readonly string[]): string {
  const used = new Set(usedColors.map((color) => normalizeHex(color)));
  return (
    ASSIGNMENT_ORDER.find((color) => !used.has(color)) ??
    ASSIGNMENT_ORDER[usedColors.length % ASSIGNMENT_ORDER.length]
  );
}
