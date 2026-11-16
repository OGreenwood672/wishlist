"use client";

import Link from "next/link";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteWishlist, setWishlistArchived } from "@/app/actions/admin";
import { ColorBar } from "@/components/theme/theme-shell";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { themeStyle } from "@/lib/theme/css";
import { timeAgo } from "@/lib/format";
import type { Wishlist } from "@/lib/types";

export interface TileData extends Wishlist {
  password: string;
  counts: { total: number; on_it: number; bought: number };
  last_activity: string | null;
}

/** One row of the dashboard index: a themed swatch, the title, stats and actions. */
export function WishlistTile({ wishlist: w, index }: { wishlist: TileData; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const t = w.theme;

  async function copy() {
    await navigator.clipboard.writeText(w.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <li className={`border-b border-line py-6 sm:py-8 grid gap-5 sm:grid-cols-[3rem_9rem_minmax(0,1fr)_auto] sm:items-start transition-opacity ${pending ? "opacity-40" : ""}`}>
      <span className="label hidden sm:block pt-1">№ {String(index).padStart(2, "0")}</span>

      {/* Swatch printed in the list's own paper and ink. */}
      <Link
        href={`/w/${w.slug}`}
        style={themeStyle(t)}
        className="group relative block aspect-[4/3] sm:aspect-[3/4] w-full sm:w-36 rounded-md border border-ink/20 bg-bg text-ink p-3 overflow-hidden"
        aria-label={`Open ${w.title}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xl">{t.emoji.mark}</span>
          <ColorBar theme={t} />
        </div>
        <div className="absolute inset-x-3 bottom-3">
          <div className="display text-2xl leading-none line-clamp-2" style={{ fontFamily: "var(--t-font-display)" }}>
            {w.title}
          </div>
          <div className="mt-1.5 h-0.5 w-8 bg-accent transition-all group-hover:w-16" />
        </div>
      </Link>

      <div className="min-w-0">
        <Link href={`/w/${w.slug}`} className="display text-3xl sm:text-4xl">
          <span className="ink-link">{w.title}</span>
        </Link>
        <p className="mt-1 text-muted line-clamp-1">{t.copy.tagline}</p>

        <dl className="mt-4 grid grid-cols-3 max-w-sm border-y border-line divide-x divide-line">
          <Stat label="Items" value={w.counts.total} />
          <Stat label="On it" value={w.counts.on_it} />
          <Stat label="Bought" value={w.counts.bought} />
        </dl>

        <div className="mt-4 flex items-center gap-1 max-w-sm">
          <span className="label w-20 shrink-0">Password</span>
          <code className="flex-1 min-w-0 font-mono text-[15px] truncate">{revealed ? w.password : "••••••••••"}</code>
          <Button size="icon" variant="ghost" onClick={() => setRevealed((r) => !r)} aria-label={revealed ? "Hide password" : "Show password"}>
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
          <Button size="icon" variant="ghost" onClick={copy} aria-label="Copy password">
            {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
          </Button>
        </div>
        <div className="label mt-2">{w.last_activity ? `Last activity ${timeAgo(w.last_activity)}` : "No activity yet"}</div>
      </div>

      <div className="flex sm:flex-col gap-2 sm:items-stretch sm:w-36">
        <Link href={`/admin/w/${w.slug}`} className={buttonClasses("outline", "sm", "flex-1 sm:flex-none")}>
          Edit
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 sm:flex-none"
          disabled={pending}
          onClick={() => startTransition(() => setWishlistArchived(w.id, !w.is_archived))}
        >
          {w.is_archived ? "Restore" : "Archive"}
        </Button>
        <ConfirmButton
          size="sm"
          variant="ghost"
          className="flex-1 sm:flex-none"
          confirmLabel="Confirm delete"
          disabled={pending}
          onConfirm={() => startTransition(() => deleteWishlist(w.id))}
        >
          Delete
        </ConfirmButton>
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-2 first:pl-0">
      <dt className="label">{label}</dt>
      <dd className="display text-3xl mt-0.5">{value}</dd>
    </div>
  );
}
