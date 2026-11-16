"use client";

import { Bell, LayoutGrid, LogOut, Menu, Palette, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { logout } from "@/app/actions/auth";
import { ColorBar } from "@/components/theme/theme-shell";
import { buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { timeAgo } from "@/lib/format";
import type { Theme } from "@/lib/theme/schema";
import { STATUS_LABELS, type Activity } from "@/lib/types";
import { useGuestName } from "./guest-name";
import { STATUS_GLYPH } from "./status-pill";

interface Props {
  wishlist: { id: string; slug: string; title: string; theme: Theme };
  isAdmin: boolean;
  activity: Activity[];
}

function seenKey(id: string) {
  return `wishlist:seen:${id}`;
}

export function WishlistHeader({ wishlist, isAdmin, activity }: Props) {
  const { name, editName } = useGuestName();
  const [feedOpen, setFeedOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  useEffect(() => {
    let stored = 0;
    try {
      stored = Number(localStorage.getItem(seenKey(wishlist.id)) ?? 0);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from localStorage after hydration
    setLastSeen(stored);
  }, [wishlist.id]);

  const newCount =
    lastSeen === null ? 0 : activity.filter((a) => new Date(a.created_at).getTime() > lastSeen).length;

  function closeFeed() {
    setFeedOpen(false);
    const now = Date.now();
    setLastSeen(now);
    try {
      localStorage.setItem(seenKey(wishlist.id), String(now));
    } catch {}
  }

  const feedButton = (
    <button
      onClick={() => setFeedOpen(true)}
      className={buttonClasses("ghost", "sm", "relative text-ink")}
      aria-label={`Activity${newCount ? `, ${newCount} new` : ""}`}
    >
      <Bell size={17} />
      <span className="hidden md:inline">Activity</span>
      {newCount > 0 && (
        <span className="ml-0.5 min-w-5 h-5 px-1 rounded-sm bg-accent text-accent-ink font-mono text-[11px] grid place-items-center">
          {newCount > 9 ? "9+" : newCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-bg/95 border-b border-ink pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 h-14 flex items-center gap-1">
          <Link href={`/w/${wishlist.slug}`} className="flex items-center gap-2.5 min-w-0 mr-auto">
            <span className="text-lg leading-none">{wishlist.theme.emoji.mark}</span>
            <span className="label text-ink truncate">{wishlist.title}</span>
          </Link>

          {/* Desktop actions */}
          <nav className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <>
                <Link href={`/admin/w/${wishlist.slug}`} className={buttonClasses("ghost", "sm")}>
                  <Palette size={16} /> Theme
                </Link>
                <Link href="/admin" className={buttonClasses("ghost", "sm")}>
                  <LayoutGrid size={16} /> All lists
                </Link>
              </>
            ) : (
              <button onClick={editName} className={buttonClasses("ghost", "sm")}>
                <UserRound size={16} /> <span className="max-w-32 truncate">{name || "Set your name"}</span>
              </button>
            )}
            {feedButton}
            <form action={logout}>
              <button type="submit" className={buttonClasses("ghost", "sm")}>
                <LogOut size={16} /> Log out
              </button>
            </form>
          </nav>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center">
            {feedButton}
            <button onClick={() => setMenuOpen(true)} className={buttonClasses("ghost", "icon", "text-ink")} aria-label="Menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav className="-mx-5 border-t border-line">
          {isAdmin ? (
            <>
              <MenuLink href={`/admin/w/${wishlist.slug}`} icon={<Palette size={18} />} onClick={() => setMenuOpen(false)}>
                Theme & password
              </MenuLink>
              <MenuLink href="/admin" icon={<LayoutGrid size={18} />} onClick={() => setMenuOpen(false)}>
                All lists
              </MenuLink>
            </>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                editName();
              }}
              className="w-full flex items-center gap-3 px-5 h-14 border-b border-line text-left"
            >
              <UserRound size={18} />
              <span className="flex-1">{name ? `You're ${name}` : "Set your name"}</span>
              <span className="label">Change</span>
            </button>
          )}
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-3 px-5 h-14 border-b border-line text-left">
              <LogOut size={18} /> Log out
            </button>
          </form>
        </nav>
        <div className="mt-5 flex items-center justify-between">
          <span className="label">Switch lists by logging in with another password</span>
          <ColorBar theme={wishlist.theme} />
        </div>
      </Dialog>

      <Dialog open={feedOpen} onClose={closeFeed} title="Activity">
        {activity.length === 0 ? (
          <p className="text-muted">Nothing yet. Status changes and comments show up here.</p>
        ) : (
          <ol className="-mx-5 sm:-mx-6 border-t border-line">
            {activity.map((item) => {
              const isNew = lastSeen !== null && new Date(item.created_at).getTime() > lastSeen;
              return (
                <li key={item.id}>
                  <Link
                    href={item.category_id ? `/w/${wishlist.slug}/c/${item.category_id}` : `/w/${wishlist.slug}`}
                    onClick={closeFeed}
                    className="flex gap-3 px-5 sm:px-6 py-3.5 border-b border-line hover:bg-ink/[0.04] transition-colors"
                  >
                    <span className="font-mono text-sm w-4 text-center pt-0.5 shrink-0" aria-hidden>
                      {glyph(item)}
                    </span>
                    <span className="flex-1 min-w-0 text-[15px] leading-snug">
                      <span className="block">{describe(item)}</span>
                      {item.type === "comment" && item.payload.excerpt && (
                        <span className="block text-muted truncate mt-0.5 italic">&ldquo;{item.payload.excerpt}&rdquo;</span>
                      )}
                      <span className="label block mt-1">{timeAgo(item.created_at)}</span>
                    </span>
                    {isNew && <span className="label text-accent shrink-0 pt-0.5">New</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </Dialog>
    </>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-5 h-14 border-b border-line">
      {icon}
      <span className="flex-1">{children}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}

function glyph(item: Activity): string {
  switch (item.type) {
    case "status":
      return STATUS_GLYPH[item.payload.status ?? "available"];
    case "comment":
      return "“";
    case "category_added":
      return "+";
    case "link_added":
      return "↗";
  }
}

function describe(item: Activity) {
  const who = <strong className="font-semibold">{item.actor_name}</strong>;
  const what = <em className="font-display not-italic text-[1.1em]">{item.payload.category}</em>;
  switch (item.type) {
    case "status":
      return (
        <>
          {who} marked {what} {STATUS_LABELS[item.payload.status ?? "available"].toLowerCase()}
        </>
      );
    case "comment":
      return (
        <>
          {who} on {what}
        </>
      );
    case "category_added":
      return (
        <>
          {who} added {what}
        </>
      );
    case "link_added":
      return (
        <>
          {who} added an option to {what}
        </>
      );
  }
}
