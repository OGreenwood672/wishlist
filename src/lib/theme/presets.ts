import type { Theme } from "./schema";

const STATUS = { available: "○", on_it: "◐", bought: "●" };
const PRIORITY = { must: "★", love: "♥", nice: "·" };

export const PRESETS: Record<string, Theme> = {
  paper: {
    name: "Paper",
    mode: "light",
    colors: {
      bg: "#f1ede4",
      surface: "#f8f6f0",
      border: "#d6d0c2",
      text: "#161513",
      muted: "#6b665b",
      accent: "#e5481e",
      accentText: "#ffffff",
    },
    background: { kind: "plain", stops: ["#e5481e", "#161513", "#d6d0c2"], pattern: "grain" },
    font: "instrument",
    emoji: { mark: "✳︎", decor: [], status: STATUS, priority: PRIORITY },
    copy: {
      tagline: "Things I've had my eye on.",
      emptyState: "Nothing listed yet.",
      gotItTitle: "Sorted",
    },
  },
  ink: {
    name: "Ink",
    mode: "dark",
    colors: {
      bg: "#121211",
      surface: "#1b1b19",
      border: "#33332f",
      text: "#eeebe3",
      muted: "#99958a",
      accent: "#d2f53c",
      accentText: "#121211",
    },
    background: { kind: "plain", stops: ["#d2f53c", "#eeebe3", "#33332f"], pattern: "grain" },
    font: "bricolage",
    emoji: { mark: "◼︎", decor: [], status: STATUS, priority: PRIORITY },
    copy: {
      tagline: "A short list of good things.",
      emptyState: "Nothing listed yet.",
      gotItTitle: "Done",
    },
  },
  festive: {
    name: "Pine & Ribbon",
    mode: "dark",
    colors: {
      bg: "#13271d",
      surface: "#183024",
      border: "#2f4a3c",
      text: "#f3ecda",
      muted: "#a9b7a4",
      accent: "#e8402c",
      accentText: "#fff7ee",
    },
    background: { kind: "frame", stops: ["#e8402c", "#f3ecda", "#c9a24a"], pattern: "snow" },
    font: "fraunces",
    emoji: {
      mark: "🎄",
      decor: ["❄️", "🎁"],
      status: { available: "🎁", on_it: "🦌", bought: "🎅" },
      priority: { must: "⭐", love: "❤️", nice: "❄️" },
    },
    copy: {
      tagline: "Dear Santa, the shortlist.",
      emptyState: "The stocking is empty, for now.",
      gotItTitle: "Wrapped",
    },
  },
  birthday: {
    name: "Party Paper",
    mode: "light",
    colors: {
      bg: "#fde8de",
      surface: "#fff4ee",
      border: "#efc6b6",
      text: "#2a1018",
      muted: "#8a5a62",
      accent: "#e3175b",
      accentText: "#ffffff",
    },
    background: { kind: "plain", stops: ["#e3175b", "#ffb21f", "#2a6df4"], pattern: "confetti" },
    font: "syne",
    emoji: {
      mark: "🎂",
      decor: ["🎈"],
      status: { available: "🎈", on_it: "🎁", bought: "🎉" },
      priority: { must: "🔥", love: "💖", nice: "🍬" },
    },
    copy: {
      tagline: "Another lap around the sun.",
      emptyState: "Candles lit, wishes pending.",
      gotItTitle: "Unwrapped",
    },
  },
  home: {
    name: "Linen",
    mode: "light",
    colors: {
      bg: "#e9e3d6",
      surface: "#f3efe6",
      border: "#cdc4b1",
      text: "#22201b",
      muted: "#706959",
      accent: "#465a22",
      accentText: "#f3efe6",
    },
    background: { kind: "frame", stops: ["#465a22", "#b8794a", "#22201b"], pattern: "grain" },
    font: "fraunces",
    emoji: {
      mark: "🏡",
      decor: [],
      status: { available: "🪴", on_it: "📦", bought: "🔑" },
      priority: { must: "🧱", love: "🛋️", nice: "🕯️" },
    },
    copy: {
      tagline: "Slowly making the place feel like home.",
      emptyState: "Bare walls, big ideas.",
      gotItTitle: "Moved in",
    },
  },
  garden: {
    name: "Herbarium",
    mode: "light",
    colors: {
      bg: "#eef0e3",
      surface: "#f7f8ef",
      border: "#cfd5bd",
      text: "#1c2516",
      muted: "#66705a",
      accent: "#c2412b",
      accentText: "#ffffff",
    },
    background: { kind: "plain", stops: ["#c2412b", "#5e7f3a", "#e8b93a"], pattern: "dots" },
    font: "playfair",
    emoji: {
      mark: "🌷",
      decor: ["🌿"],
      status: { available: "🌱", on_it: "🐝", bought: "🌻" },
      priority: { must: "🌻", love: "🌸", nice: "🌿" },
    },
    copy: {
      tagline: "Fresh picks for the season.",
      emptyState: "Seeds planted, nothing sprouted yet.",
      gotItTitle: "In bloom",
    },
  },
  ocean: {
    name: "Harbour",
    mode: "dark",
    colors: {
      bg: "#0d2232",
      surface: "#112a3c",
      border: "#2a4558",
      text: "#e8f0f2",
      muted: "#94aab5",
      accent: "#ffb547",
      accentText: "#0d2232",
    },
    background: { kind: "frame", stops: ["#ffb547", "#e8f0f2", "#3d8fb3"], pattern: "lines" },
    font: "space-grotesk",
    emoji: {
      mark: "🌊",
      decor: [],
      status: { available: "🧭", on_it: "⛵", bought: "🏝️" },
      priority: { must: "🌊", love: "🐚", nice: "🫧" },
    },
    copy: {
      tagline: "Packing list for the next adventure.",
      emptyState: "Calm waters. Nothing listed yet.",
      gotItTitle: "Packed",
    },
  },
  tech: {
    name: "Spec Sheet",
    mode: "light",
    colors: {
      bg: "#e8e8e4",
      surface: "#f2f2ef",
      border: "#c4c4bd",
      text: "#0e0e0e",
      muted: "#64645e",
      accent: "#2445ff",
      accentText: "#ffffff",
    },
    background: { kind: "plain", stops: ["#2445ff", "#ff5a1f", "#0e0e0e"], pattern: "grid" },
    font: "space-grotesk",
    emoji: {
      mark: "⌘",
      decor: [],
      status: STATUS,
      priority: PRIORITY,
    },
    copy: {
      tagline: "Upgrades pending.",
      emptyState: "No devices detected.",
      gotItTitle: "Installed",
    },
  },
  elegant: {
    name: "Ivory",
    mode: "light",
    colors: {
      bg: "#f6f2ea",
      surface: "#fbf9f4",
      border: "#e0d7c6",
      text: "#29231d",
      muted: "#857868",
      accent: "#7d5a2c",
      accentText: "#ffffff",
    },
    background: { kind: "frame", stops: ["#7d5a2c", "#d9b8a4", "#29231d"], pattern: "none" },
    font: "dm-serif",
    emoji: {
      mark: "💍",
      decor: [],
      status: { available: "🤍", on_it: "🎀", bought: "🥂" },
      priority: { must: "💎", love: "🤍", nice: "🕊️" },
    },
    copy: {
      tagline: "A few lovely things for the next chapter.",
      emptyState: "The registry is still being curated.",
      gotItTitle: "Gifted",
    },
  },
  autumn: {
    name: "Ember",
    mode: "dark",
    colors: {
      bg: "#231510",
      surface: "#2c1b14",
      border: "#4a3226",
      text: "#f4e6d4",
      muted: "#b89c86",
      accent: "#ec7a2e",
      accentText: "#1c0d03",
    },
    background: { kind: "plain", stops: ["#ec7a2e", "#f4e6d4", "#8a3b1c"], pattern: "grain" },
    font: "playfair",
    emoji: {
      mark: "🍂",
      decor: [],
      status: { available: "🍁", on_it: "🧺", bought: "☕" },
      priority: { must: "🔥", love: "🧡", nice: "🍂" },
    },
    copy: {
      tagline: "Cosy season essentials.",
      emptyState: "Kettle's on, list's empty.",
      gotItTitle: "Snuggled in",
    },
  },
  neon: {
    name: "Arcade",
    mode: "dark",
    colors: {
      bg: "#0c0c0c",
      surface: "#151515",
      border: "#2c2c2c",
      text: "#f2f2f2",
      muted: "#959595",
      accent: "#ff3df2",
      accentText: "#0c0c0c",
    },
    background: { kind: "frame", stops: ["#ff3df2", "#3df2ff", "#f2ff3d"], pattern: "grid" },
    font: "syne",
    emoji: {
      mark: "👾",
      decor: [],
      status: { available: "🎮", on_it: "🕹️", bought: "🏆" },
      priority: { must: "💥", love: "💜", nice: "⭐" },
    },
    copy: {
      tagline: "Press start on these.",
      emptyState: "Insert coin to begin.",
      gotItTitle: "Unlocked",
    },
  },
};

export const DEFAULT_THEME = PRESETS.paper;

const KEYWORDS: [string, RegExp][] = [
  ["festive", /christmas|xmas|festive|santa|holiday|winter|snow|noel/i],
  ["birthday", /birthday|bday|party|celebrat|anniversary|turning \d+/i],
  ["home", /home|house|flat|apartment|move|moving|room|bedroom|kitchen|interior|furniture|nest/i],
  ["garden", /garden|spring|plant|flower|outdoor|easter|bloom/i],
  ["ocean", /travel|trip|beach|summer|ocean|sea|surf|vacation|adventure|camp/i],
  ["tech", /tech|gadget|computer|pc|setup|desk|gear|camera|audio|keyboard/i],
  ["elegant", /wedding|registry|engag|baby|shower|bride|honeymoon/i],
  ["autumn", /autumn|fall|cosy|cozy|halloween|thanksgiving|book|reading/i],
  ["neon", /game|gaming|console|arcade|anime|neon|music|festival/i],
];

/** Fallback when AI generation isn't available: pick a preset by keyword. */
export function presetFor(title: string, description = ""): Theme {
  const text = `${title} ${description}`;
  for (const [key, re] of KEYWORDS) {
    if (re.test(text)) return PRESETS[key];
  }
  return DEFAULT_THEME;
}
