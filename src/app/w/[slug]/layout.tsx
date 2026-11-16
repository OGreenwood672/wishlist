import type { Metadata } from "next";
import { ThemeShell } from "@/components/theme/theme-shell";
import { GuestNameProvider } from "@/components/wishlist/guest-name";
import { WishlistHeader } from "@/components/wishlist/wishlist-header";
import { requireWishlistAccess } from "@/lib/auth";
import { getProfile, listActivity } from "@/lib/data";

export async function generateMetadata({ params }: LayoutProps<"/w/[slug]">): Promise<Metadata> {
  const { wishlist } = await requireWishlistAccess((await params).slug);
  return { title: wishlist.title };
}

export default async function WishlistLayout({ params, children }: LayoutProps<"/w/[slug]">) {
  const { slug } = await params;
  const { wishlist, isAdmin } = await requireWishlistAccess(slug);
  const [profile, activity] = await Promise.all([getProfile(), listActivity(wishlist.id)]);

  return (
    <ThemeShell theme={wishlist.theme}>
      <GuestNameProvider isAdmin={isAdmin} ownerName={profile.owner_name}>
        <WishlistHeader
          wishlist={{ id: wishlist.id, slug: wishlist.slug, title: wishlist.title, theme: wishlist.theme }}
          isAdmin={isAdmin}
          activity={activity}
        />
        <main className="mx-auto max-w-6xl px-4 sm:px-8 pb-safe-bar">{children}</main>
      </GuestNameProvider>
    </ThemeShell>
  );
}
