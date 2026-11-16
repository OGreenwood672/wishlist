"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addComment, deleteComment } from "@/app/actions/wishlist";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { timeAgo } from "@/lib/format";
import type { Comment } from "@/lib/types";
import { useGuestName } from "./guest-name";

export function Comments({
  categoryId,
  comments,
  isAdmin,
  canInteract,
}: {
  categoryId: string;
  comments: Comment[];
  isAdmin: boolean;
  canInteract: boolean;
}) {
  const { ensureName, name } = useGuestName();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const author = await ensureName();
    if (author === null) return;
    setError(null);
    startTransition(async () => {
      const result = await addComment(categoryId, body, author);
      if (!result.ok) return setError(result.error);
      setBody("");
    });
  }

  return (
    <div>
      {comments.length === 0 ? (
        <p className="py-5 text-muted">No notes yet. Ask a question or call dibs.</p>
      ) : (
        <ol>
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="group border-b border-line py-4"
              >
                <div className="flex items-center gap-2">
                  <span className={`label ${c.author_role === "admin" ? "text-accent" : "text-ink"}`}>
                    {c.author_name}
                    {c.author_role === "admin" && " ✳︎"}
                  </span>
                  <span className="label">· {timeAgo(c.created_at)}</span>
                  {isAdmin && (
                    <ConfirmButton
                      size="icon"
                      variant="ghost"
                      className="ml-auto -my-2 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                      confirmLabel="✕"
                      onConfirm={() => startTransition(async () => void (await deleteComment(c.id)))}
                      aria-label="Delete note"
                    >
                      <Trash2 size={15} />
                    </ConfirmButton>
                  )}
                </div>
                <p className="mt-1.5 text-[16px] leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}

      {canInteract ? (
        <form onSubmit={submit} className="mt-4">
          <div className="relative">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={3}
              maxLength={1000}
              placeholder={name ? `Write a note as ${name}…` : "Write a note…"}
              className="field resize-none pr-14"
              aria-label="Note"
            />
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="absolute right-2 bottom-2 h-10 w-10 rounded-md bg-ink text-bg grid place-items-center disabled:opacity-25 transition-opacity"
              aria-label="Post note"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
          {error && <p className="mt-2 text-accent">{error}</p>}
        </form>
      ) : (
        <p className="label mt-4">Notes are closed on this list.</p>
      )}
    </div>
  );
}
