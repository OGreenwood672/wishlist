import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { env } from "../env";
import { ensureReadable, isHex } from "./color";
import { presetFor } from "./presets";
import { GeneratedThemeSchema, ThemeSchema, type GeneratedTheme, type Theme } from "./schema";

const SYSTEM = `You art-direct themes for a wishlist web app with an editorial, printed-catalogue look:
flat paper-like backgrounds, ink-coloured text, hairline rules, big display type, and ONE bold spot colour.
Given a wishlist's title and description, return one cohesive theme that captures its mood.

Guidelines:
- Think like a print designer choosing paper stock and ink, not a tech startup. Avoid the generic purple/indigo SaaS look, neon glows and gradients.
- colors: 6-digit hex only (#rrggbb). bg is the paper colour (off-whites, creams, tinted stocks, or deep inks for dark themes). surface is a hair lighter/darker than bg. border is a visible but quiet rule colour. text is the ink and must be very readable on bg. muted is for secondary text. accent is the single spot colour used for buttons, highlights and "on it" status: make it confident and distinctive (vermilion, cobalt, olive, ochre, magenta…). accentText sits on accent.
- mode: "light" or "dark", matching bg. Light paper themes are preferred unless the mood is clearly nocturnal.
- background.kind: "plain" (flat paper) or "frame" (a fine printed border inset around the page).
- background.stops: 2-4 hex swatches printed as a small colour bar; include the accent first.
- background.pattern: a subtle paper texture or motif ("grain", "dots", "grid", "lines"), a seasonal motif ("snow", "confetti") only when it truly fits, or "none".
- font: display font for headings. instrument = refined editorial serif, fraunces = warm soft serif, dm-serif = elegant high-contrast serif, playfair = classic, bricolage = quirky characterful grotesk, syne = bold wide display, space-grotesk = technical.
- emoji: single emoji each, used sparingly. mark is the wishlist's icon. decor may be empty or 1-2 emoji. status and priority emoji should fit the theme while staying intuitive (available / someone is on it / bought; must have / would love / nice to have).
- copy: tagline is one short, warm, human line (max ~60 chars), no exclamation marks. emptyState is a gentle line for when the list is empty. gotItTitle is a 1-2 word heading for already-bought items.
- name: a 1-2 word name for the theme, like a paper stock or ink name.`;

export type GenerateResult =
  | { ok: true; theme: Theme; source: "ai" | "preset" }
  | { ok: false; theme: Theme; source: "preset"; error: string };

export async function generateTheme(input: {
  title: string;
  description?: string;
  avoid?: string;
}): Promise<GenerateResult> {
  const fallback = presetFor(input.title, input.description);

  if (!env.hasAnthropicKey) {
    return { ok: true, theme: fallback, source: "preset" };
  }

  try {
    const client = new Anthropic();
    const lines = [
      `Title: ${input.title}`,
      input.description ? `Description: ${input.description}` : null,
      input.avoid ? `Make it clearly different from the previous theme "${input.avoid}".` : null,
    ].filter(Boolean);

    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      system: SYSTEM,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(GeneratedThemeSchema),
      },
      messages: [{ role: "user", content: lines.join("\n") }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { ok: false, theme: fallback, source: "preset", error: "Couldn't generate a theme, so a preset was used." };
    }

    return { ok: true, theme: normalizeTheme(response.parsed_output, fallback), source: "ai" };
  } catch (error) {
    console.error("Theme generation failed", error);
    const message =
      error instanceof Anthropic.AuthenticationError
        ? "ANTHROPIC_API_KEY is invalid, so a preset was used."
        : error instanceof Anthropic.RateLimitError
          ? "Theme generation is rate limited right now, so a preset was used."
          : "Theme generation failed, so a preset was used.";
    return { ok: false, theme: fallback, source: "preset", error: message };
  }
}

function firstGrapheme(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return fallback;
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = segmenter.segment(trimmed)[Symbol.iterator]().next().value?.segment;
  return first && first.length <= 16 ? first : fallback;
}

function clip(value: string | undefined, max: number, fallback: string): string {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed.slice(0, max) : fallback;
}

/** Coerces model output (or hand-edited JSON) into a valid, readable Theme. */
export function normalizeTheme(raw: GeneratedTheme, fallback: Theme): Theme {
  const color = (value: string, key: keyof Theme["colors"]) =>
    isHex(value) ? value.toLowerCase() : fallback.colors[key];

  const stops = raw.background.stops.filter(isHex).slice(0, 4);
  while (stops.length < 2) stops.push(fallback.background.stops[stops.length]);

  const e = raw.emoji;
  const fe = fallback.emoji;

  const theme: Theme = {
    name: clip(raw.name, 40, fallback.name),
    mode: raw.mode,
    colors: {
      bg: color(raw.colors.bg, "bg"),
      surface: color(raw.colors.surface, "surface"),
      border: color(raw.colors.border, "border"),
      text: color(raw.colors.text, "text"),
      muted: color(raw.colors.muted, "muted"),
      accent: color(raw.colors.accent, "accent"),
      accentText: color(raw.colors.accentText, "accentText"),
    },
    background: { kind: raw.background.kind, stops, pattern: raw.background.pattern },
    font: raw.font,
    emoji: {
      mark: firstGrapheme(e.mark, fe.mark),
      decor: e.decor.map((d) => firstGrapheme(d, "")).filter(Boolean).slice(0, 2),
      status: {
        available: firstGrapheme(e.status.available, fe.status.available),
        on_it: firstGrapheme(e.status.on_it, fe.status.on_it),
        bought: firstGrapheme(e.status.bought, fe.status.bought),
      },
      priority: {
        must: firstGrapheme(e.priority.must, fe.priority.must),
        love: firstGrapheme(e.priority.love, fe.priority.love),
        nice: firstGrapheme(e.priority.nice, fe.priority.nice),
      },
    },
    copy: {
      tagline: clip(raw.copy.tagline, 120, fallback.copy.tagline),
      emptyState: clip(raw.copy.emptyState, 140, fallback.copy.emptyState),
      gotItTitle: clip(raw.copy.gotItTitle, 40, fallback.copy.gotItTitle),
    },
  };

  const readable = ensureReadable(theme);
  return ThemeSchema.parse(readable);
}

/** Validates a theme submitted from the admin editor. */
export function parseSubmittedTheme(value: unknown): Theme | null {
  const result = ThemeSchema.safeParse(value);
  return result.success ? ensureReadable(result.data) : null;
}
