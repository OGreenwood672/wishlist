import Link from "next/link";
import { Plus } from "lucide-react";
import { WishlistTile } from "@/components/admin/wishlist-tile";
import { buttonClasses } from "@/components/ui/button";
import { listWishlistsForAdmin } from "@/lib/data";
import { decryptPassword } from "@/lib/passwords";

export default async function AdminDashboard() {
  const wishlists = await listWishlistsForAdmin();
  const tiles = wishlists.map(({ password_encrypted, ...w }) => ({
    ...w,
    password: decryptPassword(password_encrypted) ?? "",
  }));
  const active = tiles.filter((w) => !w.is_archived);
  const archived = tiles.filter((w) => w.is_archived);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="label mb-2">{active.length} active · {archived.length} archived</div>
          <h1 className="display text-5xl sm:text-7xl">Your lists</h1>
        </div>
        <Link href="/admin/w/new" className={buttonClasses("primary", "lg", "hidden sm:inline-flex")}>
          <Plus size={18} /> New wishlist
        </Link>
      </div>

      {active.length === 0 ? (
        <Link href="/admin/w/new" className="group block py-16 sm:py-24 border-b border-line">
          <div className="label mb-3">Nothing here yet</div>
          <div className="display text-4xl sm:text-6xl">
            Start your first list <span className="text-accent inline-block transition-transform group-hover:translate-x-2">→</span>
          </div>
        </Link>
      ) : (
        <ol>
          {active.map((w, i) => (
            <WishlistTile key={w.id} wishlist={w} index={i + 1} />
          ))}
        </ol>
      )}

      {archived.length > 0 && (
        <section className="mt-16">
          <div className="flex items-baseline justify-between border-b border-ink pb-2">
            <h2 className="display text-3xl">Past lists</h2>
            <span className="label">Read-only for guests</span>
          </div>
          <ol className="opacity-75">
            {archived.map((w, i) => (
              <WishlistTile key={w.id} wishlist={w} index={i + 1} />
            ))}
          </ol>
        </section>
      )}

      {/* Thumb-reach primary action on phones. */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-bg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link href="/admin/w/new" className={buttonClasses("primary", "lg", "w-full")}>
          <Plus size={18} /> New wishlist
        </Link>
      </div>
    </div>
  );
}
