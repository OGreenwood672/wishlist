import { ColorBar, ThemeShell } from "@/components/theme/theme-shell";
import { StatusPill } from "@/components/wishlist/status-pill";
import type { Theme } from "@/lib/theme/schema";

/** A miniature, non-interactive wishlist printed in the given theme. */
export function ThemePreview({ theme, title }: { theme: Theme; title: string }) {
  const samples = [
    { name: "Bed frame", status: "on_it" as const, price: "£300–£600", emoji: "🛏️" },
    { name: "Headphones", status: "available" as const, price: "up to £250", emoji: "🎧" },
    { name: "Desk lamp", status: "bought" as const, price: "£80", emoji: "💡" },
  ];
  return (
    <ThemeShell theme={theme} contained className="rounded-lg border border-ink/20 p-5 sm:p-7">
      <div className="flex items-center justify-between border-b border-ink pb-2">
        <span className="label text-ink">{theme.emoji.mark} Wishlist</span>
        <ColorBar theme={theme} />
      </div>
      <h3 className="display text-5xl sm:text-6xl mt-6 break-words">{title || "Your wishlist"}</h3>
      <p className="mt-3 text-muted">{theme.copy.tagline}</p>

      <ol className="mt-6 border-t border-ink">
        {samples.map((s, i) => (
          <li key={s.name} className="flex items-center gap-3 border-b border-line py-3">
            <span className="label w-6">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-lg">{s.emoji}</span>
            <span className={`display text-2xl flex-1 truncate ${s.status === "bought" ? "line-through decoration-1 text-muted" : ""}`}>
              {s.name}
            </span>
            <span className="label hidden sm:inline">{s.price}</span>
            <StatusPill status={s.status} />
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="label">{theme.copy.gotItTitle} — 1</span>
        <span className="rounded-md bg-accent text-accent-ink px-4 py-2 text-sm font-medium">Add idea</span>
      </div>
    </ThemeShell>
  );
}
