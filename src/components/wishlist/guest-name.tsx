"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const STORAGE_KEY = "wishlist:name";

interface GuestNameContext {
  isAdmin: boolean;
  name: string;
  /** Resolves with a display name, asking for one first if needed. Null if cancelled. */
  ensureName: () => Promise<string | null>;
  editName: () => void;
}

const Ctx = createContext<GuestNameContext | null>(null);

export function useGuestName() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGuestName must be used inside GuestNameProvider");
  return ctx;
}

function readStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function GuestNameProvider({
  isAdmin,
  ownerName,
  children,
}: {
  isAdmin: boolean;
  ownerName: string;
  children: ReactNode;
}) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const resolver = useRef<((name: string | null) => void) | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from localStorage after hydration
    if (!isAdmin) setName(readStored());
  }, [isAdmin]);

  const openDialog = useCallback(() => {
    setDraft(readStored());
    setOpen(true);
  }, []);

  const ensureName = useCallback((): Promise<string | null> => {
    if (isAdmin) return Promise.resolve(ownerName || "Owner");
    const stored = readStored();
    if (stored) return Promise.resolve(stored);
    return new Promise((resolve) => {
      resolver.current = resolve;
      openDialog();
    });
  }, [isAdmin, ownerName, openDialog]);

  function close(value: string | null) {
    setOpen(false);
    resolver.current?.(value);
    resolver.current = null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = draft.trim().slice(0, 40);
    if (!value) return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Private mode: keep it for this session only.
    }
    setName(value);
    close(value);
  }

  return (
    <Ctx.Provider value={{ isAdmin, name: isAdmin ? ownerName : name, ensureName, editName: openDialog }}>
      {children}
      <Dialog open={open} onClose={() => close(null)} title="What should we call you?">
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">
            Your name shows next to comments and status changes, so everyone knows who&apos;s on what.
          </p>
          <input
            className="field"
            autoFocus
            value={draft}
            maxLength={40}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your name"
          />
          <Button type="submit" variant="primary" className="w-full" disabled={!draft.trim()}>
            Continue
          </Button>
        </form>
      </Dialog>
    </Ctx.Provider>
  );
}
