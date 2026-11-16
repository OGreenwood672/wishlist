"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ProfileSection } from "@/lib/types";

/** "Good to know" notes: sizes, colours, brands. Collapsed by default. */
export function ProfileCard({ ownerName, sections }: { ownerName: string; sections: ProfileSection[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-y border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-3.5 text-left min-h-12"
        aria-expanded={open}
      >
        <span className="label text-ink">
          {ownerName ? `Good to know about ${ownerName}` : "Good to know"} — sizes & tastes
        </span>
        <span className="label text-ink">{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <dl className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-line">
              {sections.map((s, i) => (
                <div key={i} className="py-3 border-b border-line sm:pr-6">
                  <dt className="label">{s.label}</dt>
                  <dd className="mt-1 display text-2xl whitespace-pre-line">{s.value}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
