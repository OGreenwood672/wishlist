"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { formatPrice, formatRange, timeAgo } from "@/lib/format";
import { PRIORITY_LABELS, type CategorySummary } from "@/lib/types";
import { StatusPill } from "./status-pill";

function priceLabel(c: CategorySummary): string | null {
  const linkPrices = c.links.map((l) => l.price).filter((p): p is number => p !== null);
  return (
    formatRange(c.price_min, c.price_max) ??
    (linkPrices.length === 0
      ? null
      : linkPrices.length === 1
        ? formatPrice(linkPrices[0])
        : `${formatPrice(Math.min(...linkPrices))}–${formatPrice(Math.max(...linkPrices))}`)
  );
}

/** The wishlist as a numbered index, like a printed catalogue. */
export function CategoryList({
  categories,
  slug,
  numbering,
  done = false,
}: {
  categories: CategorySummary[];
  slug: string;
  /** Stable catalogue numbers, so "№ 04" means the same thing whatever the filter. */
  numbering: Record<string, number>;
  done?: boolean;
}) {
  return (
    <ol>
      {categories.map((c, i) => (
        <motion.li
          key={c.id}
          layout="position"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.035, 0.3), ease: [0.2, 0.7, 0.2, 1] }}
        >
          <CategoryRow category={c} slug={slug} number={numbering[c.id] ?? i + 1} done={done} />
        </motion.li>
      ))}
    </ol>
  );
}

function CategoryRow({
  category: c,
  slug,
  number,
  done,
}: {
  category: CategorySummary;
  slug: string;
  number: number;
  done: boolean;
}) {
  const images = c.links.map((l) => l.image_url).filter((u): u is string => Boolean(u));
  const price = priceLabel(c);

  return (
    <Link
      href={`/w/${slug}/c/${c.id}`}
      className="group grid grid-cols-[2rem_minmax(0,1fr)_4.5rem] sm:grid-cols-[3rem_minmax(0,1fr)_auto_7rem] gap-x-3 sm:gap-x-6 items-center border-b border-line py-4 sm:py-5 -mx-4 px-4 sm:-mx-3 sm:px-3 transition-colors hover:bg-ink/[0.035] active:bg-ink/[0.06]"
    >
      <span className="label self-start pt-2 sm:pt-3">{String(number).padStart(2, "0")}</span>

      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          {c.emoji && <span className="text-xl sm:text-2xl leading-none shrink-0">{c.emoji}</span>}
          <h3
            className={`display text-[1.9rem] sm:text-5xl leading-[1.02] break-words ${done ? "line-through decoration-[1.5px] text-muted" : ""}`}
          >
            <span className="ink-link">{c.name}</span>
          </h3>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <StatusPill status={c.status} />
          {!done && (
            <span className={`label ${c.priority === "must" ? "text-accent" : ""}`}>{PRIORITY_LABELS[c.priority]}</span>
          )}
          <span className="label">
            {c.links.length} {c.links.length === 1 ? "option" : "options"}
            {c.comment_count > 0 && ` · ${c.comment_count} ${c.comment_count === 1 ? "note" : "notes"}`}
          </span>
          {price && <span className="label sm:hidden text-ink">{price}</span>}
        </div>
        {c.status !== "available" && c.status_by && (
          <p className="mt-1.5 text-[13px] text-muted">
            {c.status === "on_it" ? "On it" : "Bought"} — {c.status_by}
            {c.status_at && `, ${timeAgo(c.status_at)}`}
          </p>
        )}
      </div>

      <span className="hidden sm:block display text-2xl text-right whitespace-nowrap">{price ?? ""}</span>

      {/* Thumbnail stack */}
      <div className="relative h-[4.5rem] w-[4.5rem] sm:h-28 sm:w-28 justify-self-end">
        {images.length > 0 ? (
          images.slice(0, 2).reverse().map((src, idx, arr) => (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party hosts
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 h-full w-full object-cover rounded-md border border-ink/15 bg-surface transition-transform duration-300 ${
                arr.length > 1 && idx === 0 ? "rotate-[5deg] translate-x-1 group-hover:rotate-[9deg] group-hover:translate-x-2" : "group-hover:-rotate-2"
              } ${done ? "grayscale opacity-70" : ""}`}
            />
          ))
        ) : (
          <div className="absolute inset-0 rounded-md border border-dashed border-line grid place-items-center text-2xl sm:text-4xl text-muted">
            {c.emoji || "＋"}
          </div>
        )}
      </div>
    </Link>
  );
}
