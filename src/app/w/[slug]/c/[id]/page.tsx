import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddLinkForm } from "@/components/wishlist/add-link-form";
import { CategoryAdminActions } from "@/components/wishlist/category-admin-actions";
import { Comments } from "@/components/wishlist/comments";
import { LinkCard } from "@/components/wishlist/link-card";
import { PriorityBadge } from "@/components/wishlist/status-pill";
import { StatusSwitcher } from "@/components/wishlist/status-switcher";
import { requireWishlistAccess } from "@/lib/auth";
import { getCategoryDetail } from "@/lib/data";
import { formatRange } from "@/lib/format";

export default async function CategoryPage({ params }: PageProps<"/w/[slug]/c/[id]">) {
  const { slug, id } = await params;
  const { wishlist, isAdmin, canInteract } = await requireWishlistAccess(slug);
  const detail = /^[0-9a-f-]{36}$/i.test(id) ? await getCategoryDetail(id) : null;
  if (!detail || detail.category.wishlist_id !== wishlist.id) notFound();

  const { category, links, comments } = detail;
  const budget = formatRange(category.price_min, category.price_max);

  return (
    <div className="pt-4 sm:pt-8">
      <Link href={`/w/${slug}`} className="inline-flex items-center gap-2 h-10 label text-ink hover:text-accent transition-colors">
        <ArrowLeft size={14} /> {wishlist.title}
      </Link>

      <header className="pt-6 sm:pt-12 pb-8 sm:pb-10 border-b border-ink">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 sm:mb-6">
          <PriorityBadge priority={category.priority} />
          {budget && <span className="label">Budget {budget}</span>}
          {category.is_archived && <span className="label text-ink border border-ink rounded-sm px-1.5">Archived</span>}
        </div>
        <h1 className="display text-[clamp(3rem,12vw,8.5rem)] break-words text-balance rise">
          {category.name}
          {category.emoji && <span className="ml-3 align-[0.15em] text-[0.45em]">{category.emoji}</span>}
        </h1>
        {isAdmin && (
          <div className="mt-6">
            <CategoryAdminActions category={category} slug={slug} />
          </div>
        )}
      </header>

      <StatusSwitcher
        categoryId={category.id}
        status={category.status}
        statusBy={category.status_by}
        statusAt={category.status_at}
        disabled={!canInteract}
      />

      <div className="mt-10 sm:mt-14 grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
        <section>
          <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-5">
            <h2 className="display text-3xl sm:text-4xl">Options</h2>
            <span className="label">{links.length} {links.length === 1 ? "link" : "links"}</span>
          </div>
          {isAdmin && <AddLinkForm categoryId={category.id} />}
          {links.length === 0 ? (
            <p className="py-10 text-muted">
              {isAdmin ? "Paste a product link above to add the first option." : "No links yet. Check back soon."}
            </p>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-10 sm:grid-cols-2">
              {links.map((link, i) => (
                <LinkCard key={link.id} link={link} index={i + 1} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-1">
            <h2 className="display text-3xl sm:text-4xl">Notes</h2>
            <span className="label">{comments.length}</span>
          </div>
          <Comments categoryId={category.id} comments={comments} isAdmin={isAdmin} canInteract={canInteract} />
        </section>
      </div>
    </div>
  );
}
