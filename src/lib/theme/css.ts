import type { CSSProperties } from "react";
import type { Theme, ThemeFont } from "./schema";

const FONT_VARS: Record<ThemeFont, string> = {
  instrument: "var(--font-instrument-serif)",
  fraunces: "var(--font-fraunces)",
  "dm-serif": "var(--font-dm-serif)",
  playfair: "var(--font-playfair)",
  bricolage: "var(--font-bricolage)",
  syne: "var(--font-syne)",
  "space-grotesk": "var(--font-space-grotesk)",
};

export const FONT_LABELS: Record<ThemeFont, string> = {
  instrument: "Instrument Serif — editorial",
  fraunces: "Fraunces — warm serif",
  "dm-serif": "DM Serif — elegant",
  playfair: "Playfair — classic",
  bricolage: "Bricolage — quirky grotesk",
  syne: "Syne — bold & wide",
  "space-grotesk": "Space Grotesk — technical",
};

/** CSS custom properties consumed by globals.css / Tailwind tokens. */
export function themeStyle(theme: Theme): CSSProperties {
  const c = theme.colors;
  return {
    "--t-bg": c.bg,
    "--t-surface": c.surface,
    "--t-border": c.border,
    "--t-text": c.text,
    "--t-muted": c.muted,
    "--t-accent": c.accent,
    "--t-accent-text": c.accentText,
    "--t-font-display": FONT_VARS[theme.font],
    colorScheme: theme.mode,
  } as CSSProperties;
}
