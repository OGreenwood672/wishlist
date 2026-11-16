"use client";

import { ArrowUpRight, Loader2, Pencil, RefreshCw, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteLink, refreshLinkPreview, toggleFavourite, updateLink, type LinkInput } from "@/app/actions/wishlist";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Dialog } from "@/components/ui/dialog";
import { formatPrice, hostname } from "@/lib/format";
import type { WishLink } from "@/lib/types";

export function LinkCard({ link, index, isAdmin }: { link: WishLink; index: number; isAdmin: boolean }) {
  const [editing, setEditing] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const price = formatPrice(link.price, link.currency);
  const site = link.site_name || hostname(link.url);

  return (
    <article className={`group flex flex-col transition-opacity ${pending ? "opacity-50" : ""} ${link.is_favourite ? "sm:col-span-2" : ""}`}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block overflow-hidden rounded-md border border-ink/15 bg-surface ${link.is_favourite ? "aspect-[4/3] sm:aspect-[16/9]" : "aspect-[4/3]"}`}
      >
        {link.image_url && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party hosts
          <img
            src={link.image_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center display text-3xl text-muted">{site}</div>
        )}
        {link.is_favourite && (
          <span className="absolute top-0 left-0 bg-accent text-accent-ink font-mono text-[11px] uppercase tracking-[0.1em] px-2.5 py-1.5">
            ★ Top pick
          </span>
        )}
      </a>

      <div className="pt-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="label">{String(index).padStart(2, "0")}</span>
          {link.favicon_url && !iconFailed && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party hosts
            <img src={link.favicon_url} alt="" className="h-3.5 w-3.5" referrerPolicy="no-referrer" onError={() => setIconFailed(true)} />
          )}
          <span className="label truncate">{site}</span>
        </div>

        <div className="mt-1.5 flex items-start justify-between gap-4">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`display leading-[1.08] line-clamp-3 ${link.is_favourite ? "text-3xl sm:text-4xl" : "text-2xl"}`}
          >
            <span className="ink-link">{link.title}</span>
          </a>
          {price && <span className="display text-2xl sm:text-3xl whitespace-nowrap">{price}</span>}
        </div>

        {link.note && <p className="mt-2 text-[15px] italic text-muted">“{link.note}”</p>}

        <div className="flex-1 min-h-4" />
        <div className="flex items-center gap-1 border-t border-line pt-1">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-10 pr-2 text-[15px] font-medium text-ink hover:text-accent transition-colors mr-auto"
          >
            Visit shop <ArrowUpRight size={16} />
          </a>
          {isAdmin && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startTransition(async () => void (await toggleFavourite(link.id)))}
                aria-label={link.is_favourite ? "Remove top pick" : "Mark as top pick"}
                title={link.is_favourite ? "Remove top pick" : "Mark as top pick"}
              >
                <Star size={16} className={link.is_favourite ? "text-accent" : ""} fill={link.is_favourite ? "currentColor" : "none"} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit link" title="Edit">
                <Pencil size={16} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startTransition(async () => void (await refreshLinkPreview(link.id)))}
                aria-label="Refresh preview"
                title="Re-fetch title, image and price"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              </Button>
              <ConfirmButton
                size="icon"
                variant="ghost"
                confirmLabel="✕"
                onConfirm={() => startTransition(async () => void (await deleteLink(link.id)))}
                aria-label="Delete link"
                title="Delete"
              >
                <Trash2 size={16} />
              </ConfirmButton>
            </>
          )}
        </div>
      </div>

      {isAdmin && <EditLinkDialog link={link} open={editing} onClose={() => setEditing(false)} />}
    </article>
  );
}

function EditLinkDialog({ link, open, onClose }: { link: WishLink; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<LinkInput>({
    title: link.title,
    url: link.url,
    image_url: link.image_url ?? "",
    price: link.price,
    note: link.note,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<LinkInput>) => setForm((f) => ({ ...f, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateLink(link.id, form);
      if (!result.ok) return setError(result.error);
      onClose();
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Edit option">
      <form onSubmit={submit} className="space-y-4">
        <Labelled label="Title">
          <input className="field" value={form.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} />
        </Labelled>
        <Labelled label="Link">
          <input className="field" inputMode="url" value={form.url} onChange={(e) => set({ url: e.target.value })} />
        </Labelled>
        <Labelled label="Image URL">
          <input className="field" inputMode="url" value={form.image_url} onChange={(e) => set({ image_url: e.target.value })} placeholder="https://…" />
        </Labelled>
        <Labelled label="Price (£)">
          <input
            className="field"
            inputMode="decimal"
            value={form.price ?? ""}
            onChange={(e) => set({ price: e.target.value.replace(/[^\d.]/g, "") })}
          />
        </Labelled>
        <Labelled label="Note">
          <input className="field" value={form.note} maxLength={300} onChange={(e) => set({ note: e.target.value })} placeholder="The 140cm one, in oak" />
        </Labelled>
        {error && <p className="text-accent">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 size={16} className="animate-spin" />} Save
        </Button>
      </form>
    </Dialog>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-2 text-ink">{label}</span>
      {children}
    </label>
  );
}
