"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Dices, Eye, EyeOff, Loader2, SlidersHorizontal, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateThemeAction, saveWishlist, suggestPasswordAction } from "@/app/actions/admin";
import { ThemePreview } from "@/components/admin/theme-preview";
import { Button, buttonClasses } from "@/components/ui/button";
import { FONT_LABELS } from "@/lib/theme/css";
import { PRESETS } from "@/lib/theme/presets";
import {
  BACKGROUND_KINDS,
  BACKGROUND_PATTERNS,
  THEME_FONTS,
  type Theme,
} from "@/lib/theme/schema";

interface Props {
  id?: string;
  initial: { title: string; description: string; password: string; theme: Theme };
  hasAi: boolean;
}

export function WishlistEditor({ id, initial, hasAi }: Props) {
  const router = useRouter();
  const isNew = !id;
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [password, setPassword] = useState(initial.password);
  const [showPassword, setShowPassword] = useState(isNew);
  const [theme, setTheme] = useState<Theme>(initial.theme);
  const [generatedOnce, setGeneratedOnce] = useState(!isNew);
  const [tweaking, setTweaking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerating] = useTransition();
  const [saving, startSaving] = useTransition();

  function generate() {
    setNote(null);
    startGenerating(async () => {
      const result = await generateThemeAction({
        title,
        description,
        avoid: generatedOnce ? theme.name : undefined,
      });
      setTheme(result.theme);
      setGeneratedOnce(true);
      if (!result.ok) setNote(result.error);
      else if (result.source === "preset") setNote("Picked a preset. Add ANTHROPIC_API_KEY for AI-generated themes.");
    });
  }

  function suggest() {
    startGenerating(async () => {
      setPassword(await suggestPasswordAction());
      setShowPassword(true);
    });
  }

  function save() {
    setError(null);
    startSaving(async () => {
      const passwordChanged = password !== initial.password;
      const result = await saveWishlist({
        id,
        title,
        description,
        password: passwordChanged || isNew ? password : "",
        theme,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-6">
        <Link href="/admin" className={buttonClasses("ghost", "sm", "-ml-3")}>
          <ArrowLeft size={15} /> All lists
        </Link>
        <h1 className="mt-3 display text-5xl sm:text-6xl">
          {isNew ? "New list" : initial.title}
        </h1>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---------- Details ---------- */}
        <div className="space-y-6">
          <Field label="Title">
            <input
              className="field"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Christmas 2026"
              autoFocus={isNew}
            />
          </Field>
          <Field label="Description" hint="Optional. Also steers the generated theme.">
            <textarea
              className="field min-h-24 resize-y"
              value={description}
              maxLength={600}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Moving into my first flat. Cosy Scandi vibes."
            />
          </Field>
          <Field
            label="Guest password"
            hint={
              isNew
                ? "Anyone with this password sees this wishlist. Not case-sensitive."
                : "Changing it logs out everyone currently viewing this list."
            }
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="field pr-10 font-mono"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center text-muted hover:text-ink"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button onClick={suggest} disabled={generating} className="h-12" title="Suggest a memorable password">
                <Dices size={16} /> Suggest
              </Button>
            </div>
          </Field>

          <div className="border-t border-ink pt-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="display text-3xl">Theme</h2>
              <span className="label">{theme.name}</span>
            </div>
            <p className="text-[15px] text-muted">
              {hasAi
                ? "Generate a theme from the title and description, then tweak anything you like."
                : "Pick a theme from the title, or choose a preset below."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={generate} disabled={generating || !title.trim()}>
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {generatedOnce ? "Regenerate" : "Generate theme"}
              </Button>
              <Button onClick={() => setTweaking((t) => !t)}>
                <SlidersHorizontal size={16} /> {tweaking ? "Done" : "Tweak"}
              </Button>
            </div>
            {note && <p className="label normal-case tracking-normal text-[13px]">{note}</p>}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(preset)}
                  title={preset.name}
                  className={`shrink-0 w-20 rounded-md border p-2 text-left transition-transform active:translate-y-px ${theme.name === preset.name ? "border-ink outline outline-2 outline-offset-2 outline-accent" : "border-line"}`}
                  style={{ background: preset.colors.bg, color: preset.colors.text }}
                >
                  <span className="block h-1.5 w-6 mb-5" style={{ background: preset.colors.accent }} />
                  <span className="block text-[11px] font-mono uppercase tracking-wider truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {tweaking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ThemeTweaks theme={theme} onChange={setTheme} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------- Live preview ---------- */}
        <div className="lg:sticky lg:top-20 self-start space-y-2">
          <div className="label">Preview</div>
          <motion.div key={theme.name} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <ThemePreview theme={theme} title={title} />
          </motion.div>
        </div>
      </div>

      {/* Save bar: full-width at the bottom on phones, floating right on desktop. */}
      <div className="fixed sm:sticky inset-x-0 bottom-0 sm:bottom-4 z-30 border-t sm:border-0 border-ink bg-bg sm:bg-transparent px-4 sm:px-0 pt-3 sm:pt-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:pointer-events-none sm:[&>*]:pointer-events-auto">
        {error && (
          <p role="alert" className="text-[15px] text-accent sm:bg-bg sm:border sm:border-line sm:rounded-md sm:px-3 sm:py-2">
            {error}
          </p>
        )}
        <Button variant="primary" size="lg" onClick={save} disabled={saving || !title.trim()} className="w-full sm:w-auto">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isNew ? "Create list" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-2 text-ink">{label}</span>
      {children}
      {hint && <span className="block text-[13px] text-muted mt-1.5">{hint}</span>}
    </label>
  );
}

const COLOR_FIELDS: [keyof Theme["colors"], string][] = [
  ["bg", "Background"],
  ["surface", "Cards"],
  ["border", "Borders"],
  ["text", "Text"],
  ["muted", "Muted text"],
  ["accent", "Accent"],
  ["accentText", "On accent"],
];

function ThemeTweaks({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const set = (patch: Partial<Theme>) => onChange({ ...theme, ...patch, name: theme.name });
  const emoji = theme.emoji;

  return (
    <div className="sheet rounded-lg p-4 sm:p-5 space-y-6 text-sm">
      <section>
        <h3 className="label text-ink mb-3">Colours</h3>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_FIELDS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5">
              <input
                type="color"
                value={theme.colors[key]}
                onChange={(e) => set({ colors: { ...theme.colors, [key]: e.target.value } })}
                className="h-8 w-8 rounded-sm bg-transparent cursor-pointer"
              />
              <span className="text-muted">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-muted mr-1">Glow</span>
          {theme.background.stops.map((stop, i) => (
            <input
              key={i}
              type="color"
              value={stop}
              onChange={(e) => {
                const stops = [...theme.background.stops];
                stops[i] = e.target.value;
                set({ background: { ...theme.background, stops } });
              }}
              className="h-8 w-8 rounded-sm bg-transparent cursor-pointer"
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Select label="Mode" value={theme.mode} options={["dark", "light"]} onChange={(v) => set({ mode: v as Theme["mode"] })} />
        <Select
          label="Font"
          value={theme.font}
          options={THEME_FONTS.map((f): [string, string] => [f, FONT_LABELS[f]])}
          onChange={(v) => set({ font: v as Theme["font"] })}
        />
        <Select
          label="Background"
          value={theme.background.kind}
          options={BACKGROUND_KINDS}
          onChange={(v) => set({ background: { ...theme.background, kind: v as Theme["background"]["kind"] } })}
        />
        <Select
          label="Texture"
          value={theme.background.pattern}
          options={BACKGROUND_PATTERNS}
          onChange={(v) => set({ background: { ...theme.background, pattern: v as Theme["background"]["pattern"] } })}
        />
      </section>

      <section>
        <h3 className="label text-ink mb-3">Emoji</h3>
        <div className="grid grid-cols-4 gap-2">
          <EmojiInput label="Icon" value={emoji.mark} onChange={(v) => set({ emoji: { ...emoji, mark: v } })} />
          <EmojiInput label="Available" value={emoji.status.available} onChange={(v) => set({ emoji: { ...emoji, status: { ...emoji.status, available: v } } })} />
          <EmojiInput label="On it" value={emoji.status.on_it} onChange={(v) => set({ emoji: { ...emoji, status: { ...emoji.status, on_it: v } } })} />
          <EmojiInput label="Bought" value={emoji.status.bought} onChange={(v) => set({ emoji: { ...emoji, status: { ...emoji.status, bought: v } } })} />
          <EmojiInput label="Must" value={emoji.priority.must} onChange={(v) => set({ emoji: { ...emoji, priority: { ...emoji.priority, must: v } } })} />
          <EmojiInput label="Love" value={emoji.priority.love} onChange={(v) => set({ emoji: { ...emoji, priority: { ...emoji.priority, love: v } } })} />
          <EmojiInput label="Nice" value={emoji.priority.nice} onChange={(v) => set({ emoji: { ...emoji, priority: { ...emoji.priority, nice: v } } })} />
        </div>
        <label className="block mt-3">
          <span className="text-muted">Decor (space separated)</span>
          <input
            className="field mt-1"
            value={emoji.decor.join(" ")}
            onChange={(e) => set({ emoji: { ...emoji, decor: e.target.value.split(/\s+/).filter(Boolean).slice(0, 6) } })}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="label text-ink">Wording</h3>
        <TextInput label="Tagline" value={theme.copy.tagline} max={120} onChange={(v) => set({ copy: { ...theme.copy, tagline: v } })} />
        <TextInput label="Empty list message" value={theme.copy.emptyState} max={140} onChange={(v) => set({ copy: { ...theme.copy, emptyState: v } })} />
        <TextInput label="Bought section title" value={theme.copy.gotItTitle} max={40} onChange={(v) => set({ copy: { ...theme.copy, gotItTitle: v } })} />
      </section>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-muted">{label}</span>
      <select className="field mt-1 capitalize" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function EmojiInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-center">
      <input
        className="field text-center text-xl px-1 py-1.5"
        value={value}
        maxLength={16}
        onChange={(e) => e.target.value.trim() && onChange(e.target.value.trim())}
      />
      <span className="text-xs text-muted">{label}</span>
    </label>
  );
}

function TextInput({ label, value, max, onChange }: { label: string; value: string; max: number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-muted">{label}</span>
      <input className="field mt-1" value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
