"use client";

import { motion } from "motion/react";
import { useOptimistic, useState, useTransition } from "react";
import { setStatus } from "@/app/actions/wishlist";
import { timeAgo } from "@/lib/format";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/types";
import { useGuestName } from "./guest-name";
import { STATUS_GLYPH } from "./status-pill";

const ACTIVE: Record<Status, string> = {
  available: "bg-ink text-bg",
  on_it: "bg-accent text-accent-ink",
  bought: "bg-ink text-bg",
};

const HINTS: Record<Status, string> = {
  available: "Up for grabs. Tap “On it” if you're getting it.",
  on_it: "Someone's sorting this one.",
  bought: "All done.",
};

/**
 * Inline on desktop. On phones it's pinned to the bottom of the screen,
 * where a thumb can reach it.
 */
export function StatusSwitcher({
  categoryId,
  status,
  statusBy,
  statusAt,
  disabled,
}: {
  categoryId: string;
  status: Status;
  statusBy: string | null;
  statusAt: string | null;
  disabled: boolean;
}) {
  const { ensureName } = useGuestName();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function choose(next: Status) {
    if (next === optimistic || disabled) return;
    const name = next === "available" ? "" : await ensureName();
    if (name === null) return;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const result = await setStatus(categoryId, next, name);
      if (!result.ok) setError(result.error);
    });
  }

  const caption =
    optimistic === status && status !== "available" && statusBy ? (
      <>
        {status === "on_it" ? "On it" : "Bought"} — <span className="text-ink">{statusBy}</span>
        {statusAt && `, ${timeAgo(statusAt)}`}
      </>
    ) : (
      HINTS[optimistic]
    );

  return (
    <div className="fixed md:static inset-x-0 bottom-0 z-30 bg-bg border-t border-ink md:border-0 px-4 md:px-0 pt-3 md:pt-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-0">
      <div className="md:flex md:items-center md:gap-6">
        <div
          role="radiogroup"
          aria-label="Status"
          className="grid grid-cols-3 border border-ink rounded-md overflow-hidden md:w-[32rem] shrink-0"
        >
          {STATUSES.map((s, i) => {
            const active = optimistic === s;
            return (
              <button
                key={s}
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => choose(s)}
                className={`relative h-12 text-[15px] font-medium disabled:cursor-not-allowed ${i > 0 ? "border-l border-ink" : ""} ${active ? "" : "hover:bg-ink/[0.06]"}`}
              >
                {active && (
                  <motion.span
                    layoutId={`status-${categoryId}`}
                    className={`absolute inset-0 ${ACTIVE[s]}`}
                    transition={{ type: "tween", duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                )}
                <span className={`relative flex items-center justify-center gap-2 ${active ? (s === "on_it" ? "text-accent-ink" : "text-bg") : ""}`}>
                  <span aria-hidden className="font-mono text-xs">{STATUS_GLYPH[s]}</span>
                  {STATUS_LABELS[s]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="label normal-case tracking-normal text-[13px] mt-2 md:mt-0">
          {caption}
          {disabled && " · read-only"}
        </p>
      </div>
      {error && <p className="mt-2 text-[14px] text-accent">{error}</p>}
    </div>
  );
}
