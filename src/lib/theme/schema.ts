import { z } from "zod";

export const THEME_FONTS = [
  "instrument",
  "fraunces",
  "dm-serif",
  "playfair",
  "bricolage",
  "syne",
  "space-grotesk",
] as const;
/** plain = flat paper, frame = a printed hairline border inset around the page. */
export const BACKGROUND_KINDS = ["plain", "frame"] as const;
export const BACKGROUND_PATTERNS = [
  "none",
  "grain",
  "dots",
  "grid",
  "lines",
  "snow",
  "confetti",
] as const;

export type ThemeFont = (typeof THEME_FONTS)[number];
export type BackgroundKind = (typeof BACKGROUND_KINDS)[number];
export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const emoji = z.string().min(1).max(16);

/** The validated theme shape stored in `wishlists.theme`. */
export const ThemeSchema = z.object({
  name: z.string().min(1).max(40),
  mode: z.enum(["dark", "light"]),
  colors: z.object({
    bg: hex,
    surface: hex,
    border: hex,
    text: hex,
    muted: hex,
    accent: hex,
    accentText: hex,
  }),
  background: z.object({
    kind: z.enum(BACKGROUND_KINDS),
    /** 2–4 swatches printed as a colour bar, like a print registration strip. */
    stops: z.array(hex).min(2).max(4),
    pattern: z.enum(BACKGROUND_PATTERNS),
  }),
  font: z.enum(THEME_FONTS),
  emoji: z.object({
    mark: emoji,
    decor: z.array(emoji).max(6),
    status: z.object({ available: emoji, on_it: emoji, bought: emoji }),
    priority: z.object({ must: emoji, love: emoji, nice: emoji }),
  }),
  copy: z.object({
    tagline: z.string().max(120),
    emptyState: z.string().max(140),
    gotItTitle: z.string().min(1).max(40),
  }),
});

export type Theme = z.infer<typeof ThemeSchema>;

/**
 * Looser shape used for Claude's structured output: no regex/length limits
 * (we normalise and contrast-check afterwards instead).
 */
export const GeneratedThemeSchema = z.object({
  name: z.string(),
  mode: z.enum(["dark", "light"]),
  colors: z.object({
    bg: z.string(),
    surface: z.string(),
    border: z.string(),
    text: z.string(),
    muted: z.string(),
    accent: z.string(),
    accentText: z.string(),
  }),
  background: z.object({
    kind: z.enum(BACKGROUND_KINDS),
    stops: z.array(z.string()),
    pattern: z.enum(BACKGROUND_PATTERNS),
  }),
  font: z.enum(THEME_FONTS),
  emoji: z.object({
    mark: z.string(),
    decor: z.array(z.string()),
    status: z.object({ available: z.string(), on_it: z.string(), bought: z.string() }),
    priority: z.object({ must: z.string(), love: z.string(), nice: z.string() }),
  }),
  copy: z.object({
    tagline: z.string(),
    emptyState: z.string(),
    gotItTitle: z.string(),
  }),
});

export type GeneratedTheme = z.infer<typeof GeneratedThemeSchema>;
