"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Theme } from "@/lib/theme/schema";
import type { CategorySummary } from "@/lib/types";
import { CategoryList } from "./category-grid";

export function GotItSection({
  categories,
  slug,
  theme,
  numbering,
}: {
  categories: CategorySummary[];
  slug: string;
  theme: Theme;
  numbering: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-16 sm:mt-24">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-baseline justify-between gap-4 border-b border-ink pb-2 text-left"
        aria-expanded={open}
      >
        <h2 className="display text-3xl sm:text-4xl">
          {theme.copy.gotItTitle} <span className="text-muted">({categories.length})</span>
        </h2>
        <span className="label text-ink">{open ? "Hide −" : "Show +"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <CategoryList categories={categories} slug={slug} numbering={numbering} done />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
