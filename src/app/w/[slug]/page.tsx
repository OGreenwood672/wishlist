import { ColorBar } from "@/components/theme/theme-shell";
import { CategoryList } from "@/components/wishlist/category-grid";
import { WishlistToolbar, type Filters } from "@/components/wishlist/filter-bar";
import { GotItSection } from "@/components/wishlist/got-it-section";
import { ProfileCard } from "@/components/wishlist/profile-card";
import { requireWishlistAccess } from "@/lib/auth";
import { getProfile, listCategorySummaries } from "@/lib/data";
import { PRIORITIES, type CategorySummary, type Priority } from "@/lib/types";

const PRIORITY_RANK: Record<Priority, number> = { must: 0, love: 1, nice: 2 };

function lowestPrice(c: CategorySummary): number | null {
  const prices = c.links.map((l) => l.price).filter((p): p is number => p !== null);
  if (c.price_min !== null) prices.push(c.price_min);
  return prices.length ? Math.min(...prices) : null;
}

function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const pick = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);
  const status = pick("status");
  const priority = pick("priority");
  const sort = pick("sort");
  return {
    status: status === "available" || status === "on_it" ? status : "all",
    priority: PRIORITIES.includes(priority as Priority) ? (priority as Priority) : "all",
    sort: sort === "newest" || sort === "price" ? sort : "priority",
  };
}

export default async function WishlistPage({ params, searchParams }: PageProps<"/w/[slug]">) {
  const { slug } = await params;
  const { wishlist, isAdmin } = await requireWishlistAccess(slug);
  const [categories, profile] = await Promise.all([listCategorySummaries(wishlist.id), getProfile()]);
  const filters = parseFilters(await searchParams);
  const { theme } = wishlist;

  // Catalogue numbers follow the order items were added, so they never shuffle.
  const numbering = Object.fromEntries(
    [...categories].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((c, i) => [c.id, i + 1]),
  );

  const done = categories.filter((c) => c.status === "bought" || c.is_archived);
  const open = categories
    .filter((c) => c.status !== "bought" && !c.is_archived)
    .filter((c) => filters.status === "all" || c.status === filters.status)
    .filter((c) => filters.priority === "all" || c.priority === filters.priority)
    .sort((a, b) => {
      if (filters.sort === "newest") return b.created_at.localeCompare(a.created_at);
      if (filters.sort === "price") {
        const pa = lowestPrice(a);
        const pb = lowestPrice(b);
        if (pa === null) return pb === null ? 0 : 1;
        if (pb === null) return -1;
        return pa - pb;
      }
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || numbering[a.id] - numbering[b.id];
    });
  const openTotal = categories.length - done.length;
  const onIt = categories.filter((c) => c.status === "on_it").length;

  return (
    <>
      {wishlist.is_archived && (
        <div className="mt-4 border border-ink rounded-md px-4 py-3 text-[15px]">
          <span className="label text-ink mr-2">Archived</span>
          This list has wrapped up{isAdmin ? "." : " — you can look around, but it's read-only now."}
        </div>
      )}

      <section className="pt-10 sm:pt-20 pb-8 sm:pb-12">
        <div className="flex items-center justify-between gap-4 mb-5 sm:mb-8">
          <span className="label">
            {openTotal} {openTotal === 1 ? "item" : "items"}
            {onIt > 0 && ` · ${onIt} on it`}
            {done.length > 0 && ` · ${done.length} done`}
          </span>
          <ColorBar theme={theme} />
        </div>
        <h1 className="display text-[clamp(3.25rem,14vw,10rem)] text-balance break-words rise">{wishlist.title}</h1>
        <div className="mt-5 sm:mt-8 grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-10">
          <p className="display text-2xl sm:text-3xl italic text-pretty">{theme.copy.tagline}</p>
          {wishlist.description && <p className="text-muted text-pretty sm:pt-1.5">{wishlist.description}</p>}
        </div>
      </section>

      {profile.sections.length > 0 && <ProfileCard ownerName={profile.owner_name} sections={profile.sections} />}

      <div className="mt-8 sm:mt-12">
        <WishlistToolbar filters={filters} wishlistId={wishlist.id} isAdmin={isAdmin} />
      </div>

      {openTotal === 0 ? (
        <div className="py-20 sm:py-28 border-b border-line">
          <p className="display text-4xl sm:text-6xl text-muted">{theme.copy.emptyState}</p>
          {isAdmin && <p className="label mt-4">Add your first item, like “Bed frame”.</p>}
        </div>
      ) : open.length === 0 ? (
        <p className="py-16 text-muted border-b border-line">Nothing matches those filters.</p>
      ) : (
        <CategoryList categories={open} slug={wishlist.slug} numbering={numbering} />
      )}

      {done.length > 0 && <GotItSection categories={done} slug={wishlist.slug} theme={theme} numbering={numbering} />}
    </>
  );
}
