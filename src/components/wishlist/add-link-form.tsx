"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addLink } from "@/app/actions/wishlist";

export function AddLinkForm({ categoryId }: { categoryId: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addLink(categoryId, url);
      if (!result.ok) return setError(result.error);
      setUrl("");
    });
  }

  return (
    <form onSubmit={submit} className="mb-8">
      <label htmlFor="add-link" className="label block mb-2 text-ink">
        Add an option — paste a product link
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id="add-link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          inputMode="url"
          enterKeyHint="go"
          autoCapitalize="off"
          autoCorrect="off"
          className="field flex-1 min-w-0"
        />
        <button
          type="submit"
          disabled={pending || !url.trim()}
          className="h-12 px-5 rounded-md bg-ink text-bg text-[15px] font-medium inline-flex items-center gap-2 disabled:opacity-30 transition-opacity"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Fetching" : "Add"}
        </button>
      </div>
      {pending && <p className="label mt-2">Reading the page for a title, image and price…</p>}
      {error && <p className="mt-2 text-accent">{error}</p>}
    </form>
  );
}
