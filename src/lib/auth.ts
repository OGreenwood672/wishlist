import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCategory, getProfile, getWishlistById, getWishlistBySlug } from "./data";
import { getSession } from "./session";
import type { Category, Role, Wishlist } from "./types";

export interface Access {
  wishlist: Wishlist;
  role: Role;
  isAdmin: boolean;
  /** Can change status / comment. False for guests on archived wishlists. */
  canInteract: boolean;
}

export const getCurrentSession = cache(getSession);

function accessFor(wishlist: Wishlist, role: Role): Access {
  const isAdmin = role === "admin";
  return { wishlist, role, isAdmin, canInteract: isAdmin || !wishlist.is_archived };
}

async function resolveAccess(wishlist: Wishlist | null): Promise<Access | null> {
  if (!wishlist) return null;
  const session = await getCurrentSession();
  if (session?.role === "admin") return accessFor(wishlist, "admin");
  if (
    session?.role === "guest" &&
    session.wid === wishlist.id &&
    session.v === wishlist.password_version
  ) {
    return accessFor(wishlist, "guest");
  }
  return null;
}

/** For pages: the slug in the URL is never trusted on its own. */
export const requireWishlistAccess = cache(async (slug: string): Promise<Access> => {
  const access = await resolveAccess(await getWishlistBySlug(slug));
  if (!access) redirect("/");
  return access;
});

export async function requireAdminPage(): Promise<void> {
  const session = await getCurrentSession();
  if (session?.role !== "admin") redirect("/");
}

// --- Server action guards (throw instead of redirect) -----------------------

export class AuthError extends Error {}

export async function assertAdmin(): Promise<void> {
  const session = await getSession();
  if (session?.role !== "admin") throw new AuthError("Admin only");
}

export async function authorizeWishlist(
  wishlistId: string,
  need: "view" | "interact" | "admin",
): Promise<Access> {
  const access = await resolveAccess(await getWishlistById(wishlistId));
  if (!access) throw new AuthError("Not allowed");
  if (need === "admin" && !access.isAdmin) throw new AuthError("Admin only");
  if (need === "interact" && !access.canInteract) {
    throw new AuthError("This wishlist has wrapped up and is read-only.");
  }
  return access;
}

export async function authorizeCategory(
  categoryId: string,
  need: "view" | "interact" | "admin",
): Promise<Access & { category: Category }> {
  const category = await getCategory(categoryId);
  if (!category) throw new AuthError("Not found");
  return { ...(await authorizeWishlist(category.wishlist_id, need)), category };
}

/** Display name used for the owner in activity / comments. */
export async function ownerName(): Promise<string> {
  return (await getProfile()).owner_name || "Owner";
}
