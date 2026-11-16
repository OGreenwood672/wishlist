"use client";

import { Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Priority } from "@/lib/types";
import { NewCategoryDialog } from "./category-form";

export interface Filters {
  status: "all" | "available" | "on_it";
  priority: "all" | Priority;
  sort: "priority" | "newest" | "price";
}

const DEFAULTS: Filters = { status: "all", priority: "all", sort: "priority" };

const GROUPS: { key: keyof Filters; label: string; options: [string, string][] }[] = [
  {
    key: "status",
    label: "Show",
    options: [
      ["all", "Everything"],
      ["available", "Available"],
      ["on_it", "On it"],
    ],
  },
  {
    key: "priority",
    label: "Priority",
    options: [
      ["all", "Any"],
      ["must", "Must have"],
      ["love", "Would love"],
      ["nice", "Nice to have"],
    ],
  },
  {
    key: "sort",
    label: "Sort",
    options: [
      ["priority", "Priority"],
      ["newest", "Newest"],
      ["price", "Price"],
    ],
  },
];

function useFilterHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (key: keyof Filters, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === DEFAULTS[key]) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
}

/**
 * Desktop: an inline row of text tabs. Phones: a bottom action bar
 * (thumb reach) with a filter sheet and, for the owner, an add button.
 */
export function WishlistToolbar({
  filters,
  wishlistId,
  isAdmin,
}: {
  filters: Filters;
  wishlistId: string;
  isAdmin: boolean;
}) {
  const href = useFilterHref();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const activeCount = (Object.keys(DEFAULTS) as (keyof Filters)[]).filter((k) => filters[k] !== DEFAULTS[k]).length;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-end justify-between gap-6 border-b border-ink pb-3">
        <div className="flex gap-8">
          {GROUPS.map((group) => (
            <div key={group.key}>
              <div className="label mb-1.5">{group.label}</div>
              <div className="flex gap-3">
                {group.options.map(([value, label]) => {
                  const active = filters[group.key] === value;
                  return (
                    <Link
                      key={value}
                      href={href(group.key, value)}
                      scroll={false}
                      replace
                      className={`text-[15px] pb-0.5 border-b transition-colors ${active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus size={17} /> Add item
          </Button>
        )}
      </div>

      {/* Phone bottom bar */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-bg border-t border-ink px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal size={17} /> Filter & sort
          {activeCount > 0 && (
            <span className="ml-1 h-5 min-w-5 px-1 rounded-sm bg-accent text-accent-ink font-mono text-[11px] grid place-items-center">
              {activeCount}
            </span>
          )}
        </Button>
        {isAdmin && (
          <Button variant="primary" size="lg" className="flex-1" onClick={() => setAdding(true)}>
            <Plus size={18} /> Add item
          </Button>
        )}
      </div>

      <Dialog open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filter & sort">
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <fieldset key={group.key}>
              <legend className="label mb-2">{group.label}</legend>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map(([value, label]) => {
                  const active = filters[group.key] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => router.replace(href(group.key, value), { scroll: false })}
                      className={`h-12 rounded-md border text-[15px] transition-colors ${active ? "bg-ink text-bg border-ink" : "border-line"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <Button variant="primary" size="lg" className="w-full" onClick={() => setSheetOpen(false)}>
            Done
          </Button>
        </div>
      </Dialog>

      {isAdmin && <NewCategoryDialog wishlistId={wishlistId} open={adding} onClose={() => setAdding(false)} />}
    </>
  );
}
