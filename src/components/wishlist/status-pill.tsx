import type { Theme } from "@/lib/theme/schema";
import { PRIORITY_LABELS, STATUS_LABELS, type Priority, type Status } from "@/lib/types";

/** Printed glyphs read better than coloured blobs: ○ open, ◐ in progress, ● done. */
export const STATUS_GLYPH: Record<Status, string> = { available: "○", on_it: "◐", bought: "●" };

const STATUS_STYLES: Record<Status, string> = {
  available: "text-muted border-line",
  on_it: "text-accent-ink bg-accent border-accent",
  bought: "text-bg bg-ink border-ink",
};

/** Rectangular "stamp" tag. */
export function StatusPill({ status, className = "" }: { status: Status; theme?: Theme; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] leading-none whitespace-nowrap ${STATUS_STYLES[status]} ${className}`}
    >
      <span aria-hidden className="text-[10px]">{STATUS_GLYPH[status]}</span>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority; theme?: Theme }) {
  return (
    <span className="label inline-flex items-center gap-1">
      <span aria-hidden className={priority === "must" ? "text-accent" : ""}>
        {priority === "must" ? "★★★" : priority === "love" ? "★★☆" : "★☆☆"}
      </span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
