"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { saveProfile } from "@/app/actions/admin";
import { Button, buttonClasses } from "@/components/ui/button";
import type { Profile, ProfileSection } from "@/lib/types";

const SUGGESTIONS = ["Clothing size", "Shoe size", "Favourite colours", "Brands I love", "Please avoid", "Ring size"];

export function ProfileEditor({ initial }: { initial: Profile }) {
  const [ownerName, setOwnerName] = useState(initial.owner_name);
  const [sections, setSections] = useState<ProfileSection[]>(
    initial.sections.length ? initial.sections : [{ label: "Clothing size", value: "" }],
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<ProfileSection>) =>
    setSections((s) => s.map((sec, j) => (j === i ? { ...sec, ...patch } : sec)));

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveProfile({ owner_name: ownerName, sections });
      if (!result.ok) return setError(result.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const unused = SUGGESTIONS.filter((s) => !sections.some((sec) => sec.label === s));

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/admin" className={buttonClasses("ghost", "sm", "-ml-3")}>
          <ArrowLeft size={15} /> All wishlists
        </Link>
        <h1 className="mt-3 display text-5xl sm:text-6xl">About me</h1>
        <p className="mt-2 text-muted">
          Shown as a card at the top of every wishlist, so gift-givers know your sizes and tastes.
        </p>
      </div>

      <label className="block">
        <span className="label block mb-2 text-ink">Your name</span>
        <input
          className="field"
          value={ownerName}
          maxLength={40}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="Alex"
        />
        <span className="block text-[13px] text-muted mt-1.5">Used when you comment or change a status.</span>
      </label>

      <div className="border-t border-ink">
        <AnimatePresence initial={false}>
          {sections.map((section, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-line py-3 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2 items-start"
            >
              <input
                className="field"
                value={section.label}
                maxLength={40}
                placeholder="Label"
                onChange={(e) => update(i, { label: e.target.value })}
              />
              <textarea
                className="field min-h-12 resize-y col-span-2 sm:col-span-1 order-3 sm:order-none"
                rows={1}
                value={section.value}
                maxLength={400}
                placeholder="e.g. Medium, UK 9"
                onChange={(e) => update(i, { value: e.target.value })}
              />
              <Button size="icon" variant="ghost" className="h-12 order-2 sm:order-none" onClick={() => setSections((s) => s.filter((_, j) => j !== i))} aria-label="Remove">
                <X size={16} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 pt-4">
          <Button size="sm" onClick={() => setSections((s) => [...s, { label: "", value: "" }])}>
            <Plus size={14} /> Add row
          </Button>
          {unused.map((label) => (
            <Button key={label} size="sm" variant="ghost" onClick={() => setSections((s) => [...s, { label, value: "" }])}>
              + {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="lg" onClick={save} disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
          {saved ? "Saved" : "Save"}
        </Button>
        {error && <p className="text-accent">{error}</p>}
      </div>
    </div>
  );
}
