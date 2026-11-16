import type { Theme } from "./schema";

export function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Linear blend: t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const ca = toRgb(a);
  const cb = toRgb(b);
  return toHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * t) as [number, number, number]);
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const INK_DARK = "#0c0c10";
const INK_LIGHT = "#f6f6f8";

function bestInk(bg: string): string {
  return contrast(INK_DARK, bg) >= contrast(INK_LIGHT, bg) ? INK_DARK : INK_LIGHT;
}

/**
 * Nudges a theme until text is comfortably readable on its backgrounds.
 * Generated themes are creative; this keeps them usable.
 */
export function ensureReadable(theme: Theme): Theme {
  const c = { ...theme.colors };

  if (contrast(c.text, c.bg) < 7 || contrast(c.text, c.surface) < 4.5) {
    c.text = bestInk(c.bg);
  }
  // Pull the surface toward the background if it fights the text.
  for (let i = 0; i < 5 && contrast(c.text, c.surface) < 4.5; i++) {
    c.surface = mix(c.surface, c.bg, 0.5);
  }
  for (let t = 0.35; contrast(c.muted, c.bg) < 3.5 && t <= 0.85; t += 0.1) {
    c.muted = mix(c.bg, c.text, t);
  }
  if (contrast(c.accentText, c.accent) < 4.5) {
    c.accentText = bestInk(c.accent);
  }
  // Hairline rules carry the layout, so they must stay visible.
  if (contrast(c.border, c.bg) < 1.35) {
    c.border = mix(c.bg, c.text, 0.2);
  }

  return { ...theme, colors: c };
}
