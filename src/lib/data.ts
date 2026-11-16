import "server-only";
import { cache } from "react";
import { db } from "./supabase";
import type {
  Activity,
  Category,
  CategorySummary,
  Comment,
  Profile,
  Wishlist,
  WishLink,
} from "./types";

const WISHLIST_COLUMNS =
  "id, slug, title, description, theme, is_archived, password_version, created_at";

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

function num(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

// --- Wishlists --------------------------------------------------------------

export const getWishlistBySlug = cache(async (slug: string): Promise<Wishlist | null> => {
  const { data, error } = await db()
    .from("wishlists")
    .select(WISHLIST_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Wishlist | null;
});

export async function getWishlistById(id: string): Promise<Wishlist | null> {
  const { data, error } = await db()
    .from("wishlists")
    .select(WISHLIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Wishlist | null;
}

export async function findWishlistByPasswordLookup(lookup: string) {
  const { data, error } = await db()
    .from("wishlists")
    .select(WISHLIST_COLUMNS)
    .eq("password_lookup", lookup)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Wishlist | null;
}

export interface WishlistOverview extends Wishlist {
  password_encrypted: string;
  counts: { total: number; on_it: number; bought: number };
  last_activity: string | null;
}

export async function listWishlistsForAdmin(): Promise<WishlistOverview[]> {
  const rows = check(
    await db()
      .from("wishlists")
      .select(
        `${WISHLIST_COLUMNS}, password_encrypted, categories(status, is_archived), activity(created_at)`,
      )
      .order("is_archived")
      .order("sort_order")
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "activity", ascending: false })
      .limit(1, { referencedTable: "activity" }),
  ) as (Wishlist & {
    password_encrypted: string;
    categories: { status: string; is_archived: boolean }[];
    activity: { created_at: string }[];
  })[];

  return rows.map(({ categories, activity, ...w }) => ({
    ...w,
    counts: {
      total: categories.length,
      on_it: categories.filter((c) => c.status === "on_it").length,
      bought: categories.filter((c) => c.status === "bought").length,
    },
    last_activity: activity[0]?.created_at ?? null,
  }));
}

export async function getWishlistPasswordEncrypted(id: string): Promise<string | null> {
  const { data } = await db()
    .from("wishlists")
    .select("password_encrypted")
    .eq("id", id)
    .maybeSingle();
  return (data?.password_encrypted as string | undefined) ?? null;
}

// --- Categories -------------------------------------------------------------

function toCategory(row: Record<string, unknown>): Category {
  return {
    ...(row as unknown as Category),
    price_min: num(row.price_min),
    price_max: num(row.price_max),
  };
}

function toLink(row: Record<string, unknown>): WishLink {
  return { ...(row as unknown as WishLink), price: num(row.price) };
}

export async function listCategorySummaries(wishlistId: string): Promise<CategorySummary[]> {
  const rows = check(
    await db()
      .from("categories")
      .select("*, links(id, image_url, price, currency, is_favourite, created_at), comments(count)")
      .eq("wishlist_id", wishlistId)
      .order("created_at", { ascending: false }),
  ) as (Record<string, unknown> & {
    links: Record<string, unknown>[];
    comments: { count: number }[];
  })[];

  return rows.map(({ links, comments, ...row }) => ({
    ...toCategory(row),
    links: links
      .map((l) => ({ ...(l as unknown as WishLink), price: num(l.price) }))
      .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite)),
    comment_count: comments[0]?.count ?? 0,
  }));
}

export async function getCategory(id: string): Promise<Category | null> {
  const { data, error } = await db().from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCategory(data) : null;
}

export async function getCategoryDetail(id: string) {
  const category = await getCategory(id);
  if (!category) return null;
  const [links, comments] = await Promise.all([
    db()
      .from("links")
      .select("*")
      .eq("category_id", id)
      .order("is_favourite", { ascending: false })
      .order("created_at"),
    db().from("comments").select("*").eq("category_id", id).order("created_at"),
  ]);
  return {
    category,
    links: (check(links) as Record<string, unknown>[]).map(toLink),
    comments: check(comments) as Comment[],
  };
}

export async function getLink(id: string): Promise<WishLink | null> {
  const { data, error } = await db().from("links").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toLink(data) : null;
}

export async function getComment(id: string): Promise<Comment | null> {
  const { data, error } = await db().from("comments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Comment | null;
}

// --- Activity & profile -----------------------------------------------------

export async function listActivity(wishlistId: string, limit = 40): Promise<Activity[]> {
  return check(
    await db()
      .from("activity")
      .select("*")
      .eq("wishlist_id", wishlistId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ) as Activity[];
}

export async function logActivity(entry: Omit<Activity, "id" | "created_at">): Promise<void> {
  const { error } = await db().from("activity").insert(entry);
  if (error) console.error("Failed to log activity", error.message);
}

export const getProfile = cache(async (): Promise<Profile> => {
  const { data } = await db().from("profile").select("owner_name, sections").eq("id", 1).maybeSingle();
  return {
    owner_name: (data?.owner_name as string | undefined) ?? "",
    sections: (data?.sections as Profile["sections"] | undefined) ?? [],
  };
});
