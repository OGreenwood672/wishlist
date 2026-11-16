"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCategory, updateCategory, type CategoryInput } from "@/app/actions/wishlist";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PRIORITIES, PRIORITY_LABELS, type Category, type Priority } from "@/lib/types";

const EMOJI_IDEAS = ["🛏️", "🛋️", "🎧", "👟", "📚", "🎮", "📷", "⌚", "🧥", "🍳", "🪴", "💡", "🎒", "🧸", "🎨", "🚲"];

export function CategoryForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: CategoryInput;
  submitLabel: string;
  onSubmit: (input: CategoryInput) => Promise<string | null>;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<CategoryInput>) => setForm((f) => ({ ...f, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => setError(await onSubmit(form)));
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="label block mb-2 text-ink" htmlFor="category-name">
          What is it?
        </label>
        <div className="flex gap-2">
          <input
            className="field w-14 text-center text-2xl px-1"
            value={form.emoji}
            maxLength={16}
            onChange={(e) => set({ emoji: e.target.value })}
            placeholder="＋"
            aria-label="Emoji"
          />
          <input
            id="category-name"
            className="field flex-1 font-display text-xl"
            value={form.name}
            maxLength={80}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Bed frame"
            enterKeyHint="done"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar mt-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
          {EMOJI_IDEAS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => set({ emoji })}
              className={`shrink-0 h-10 w-10 rounded-md text-lg ${form.emoji === emoji ? "bg-ink/10 outline outline-1 outline-ink" : "hover:bg-ink/[0.06]"}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <fieldset>
        <legend className="label mb-2 text-ink">Priority</legend>
        <div className="grid grid-cols-3 border border-ink rounded-md overflow-hidden divide-x divide-ink">
          {PRIORITIES.map((p: Priority) => (
            <button
              key={p}
              type="button"
              onClick={() => set({ priority: p })}
              className={`h-12 px-1 text-sm transition-colors ${form.priority === p ? "bg-ink text-bg" : "hover:bg-ink/[0.06]"}`}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-2 text-ink">Budget · optional</legend>
        <div className="flex items-center gap-2">
          <PriceInput value={form.price_min} onChange={(v) => set({ price_min: v })} placeholder="From" />
          <span className="text-muted">–</span>
          <PriceInput value={form.price_max} onChange={(v) => set({ price_max: v })} placeholder="To" />
        </div>
      </fieldset>

      {error && <p className="text-accent">{error}</p>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending || !form.name.trim()}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | string | null;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">£</span>
      <input
        className="field pl-7"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder={placeholder}
      />
    </div>
  );
}

export function NewCategoryDialog({
  wishlistId,
  open,
  onClose,
}: {
  wishlistId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <Dialog open={open} onClose={onClose} title="Add an item">
      <CategoryForm
        initial={{ name: "", emoji: "", priority: "love", price_min: null, price_max: null }}
        submitLabel="Add to list"
        onSubmit={async (input) => {
          const result = await createCategory(wishlistId, input);
          if (!result.ok) return result.error;
          onClose();
          router.push(`${window.location.pathname}/c/${result.id}`);
          return null;
        }}
      />
    </Dialog>
  );
}

export function EditCategoryDialog({
  category,
  open,
  onClose,
}: {
  category: Category;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Edit item">
      <CategoryForm
        initial={{
          name: category.name,
          emoji: category.emoji,
          priority: category.priority,
          price_min: category.price_min,
          price_max: category.price_max,
        }}
        submitLabel="Save"
        onSubmit={async (input) => {
          const result = await updateCategory(category.id, input);
          if (!result.ok) return result.error;
          onClose();
          return null;
        }}
      />
    </Dialog>
  );
}
