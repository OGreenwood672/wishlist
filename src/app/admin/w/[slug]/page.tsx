import { notFound } from "next/navigation";
import { WishlistEditor } from "@/components/admin/wishlist-editor";
import { getWishlistBySlug, getWishlistPasswordEncrypted } from "@/lib/data";
import { env } from "@/lib/env";
import { decryptPassword } from "@/lib/passwords";

export default async function EditWishlistPage({ params }: PageProps<"/admin/w/[slug]">) {
  const { slug } = await params;
  const wishlist = await getWishlistBySlug(slug);
  if (!wishlist) notFound();
  const encrypted = await getWishlistPasswordEncrypted(wishlist.id);

  return (
    <WishlistEditor
      id={wishlist.id}
      hasAi={env.hasAnthropicKey}
      initial={{
        title: wishlist.title,
        description: wishlist.description,
        password: (encrypted && decryptPassword(encrypted)) || "",
        theme: wishlist.theme,
      }}
    />
  );
}
