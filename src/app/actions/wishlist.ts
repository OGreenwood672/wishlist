"use server";

import { revalidatePath } from "next/cache";
import { AuthError, authorizeCategory, authorizeWishlist, ownerName, type Access } from "@/lib/auth";
import { getComment, getLink, logActivity } from "@/lib/data";
import { fetchLinkPreview, normalizeUrl } from "@/lib/link-preview";
import { db } from "@/lib/supabase";
import {
  PRIORITIES,
  STATUSES,
  type Priority,
  type Status,
  type WishLink,
} from "@/lib/types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function guard<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function refresh(access: Access) {
  revalidatePath(`/w/${access.wishlist.slug}`, "layout");
  revalidatePath("/admin");
}

/** Guests supply their own display name; the owner uses the profile name. */
async function actorFor(access: Access, guestName: string) {
  if (access.isAdmin) return { actor_name: await ownerName(), actor_role: "admin" as const };
  const name = String(guestName ?? "").trim().slice(0, 40);
  return { actor_name: name || "Someone", actor_role: "guest" as const };
}

function price(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

// --- Categories -------------------------------------------------------------

export interface CategoryInput {
  name: string;
  emoji: string;
  priority: Priority;
  price_min: number | string | null;
  price_max: number | string | null;
}

function cleanCategory(input: CategoryInput) {
  let min = price(input.price_min);
  let max = price(input.price_max);
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  return {
    name: String(input.name ?? "").trim().slice(0, 80),
    emoji: String(input.emoji ?? "").trim().slice(0, 16),
    priority: PRIORITIES.includes(input.priority) ? input.priority : "love",
    price_min: min,
    price_max: max,
  };
}

export async function createCategory(
  wishlistId: string,
  input: CategoryInput,
): Promise<Result<{ id: string }>> {
  return guard<{ id: string }>(async () => {
    const access = await authorizeWishlist(wishlistId, "admin");
    const fields = cleanCategory(input);
    if (!fields.name) return { ok: false, error: "Give the category a name." };
    const { data, error } = await db()
      .from("categories")
      .insert({ wishlist_id: wishlistId, ...fields })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    await logActivity({
      wishlist_id: wishlistId,
      category_id: data.id,
      ...(await actorFor(access, "")),
      type: "category_added",
      payload: { category: fields.name },
    });
    refresh(access);
    return { ok: true, id: data.id as string };
  });
}

export async function updateCategory(categoryId: string, input: CategoryInput): Promise<Result> {
  return guard(async () => {
    const access = await authorizeCategory(categoryId, "admin");
    const fields = cleanCategory(input);
    if (!fields.name) return { ok: false, error: "Give the category a name." };
    const { error } = await db().from("categories").update(fields).eq("id", categoryId);
    if (error) return { ok: false, error: error.message };
    refresh(access);
    return { ok: true };
  });
}

export async function setCategoryArchived(categoryId: string, archived: boolean): Promise<Result> {
  return guard(async () => {
    const access = await authorizeCategory(categoryId, "admin");
    await db().from("categories").update({ is_archived: archived }).eq("id", categoryId);
    refresh(access);
    return { ok: true };
  });
}

export async function deleteCategory(categoryId: string): Promise<Result> {
  return guard(async () => {
    const access = await authorizeCategory(categoryId, "admin");
    await db().from("categories").delete().eq("id", categoryId);
    refresh(access);
    return { ok: true };
  });
}

export async function setStatus(
  categoryId: string,
  status: Status,
  guestName: string,
): Promise<Result> {
  return guard(async () => {
    if (!STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
    const access = await authorizeCategory(categoryId, "interact");
    if (access.category.status === status) return { ok: true };
    const actor = await actorFor(access, guestName);
    const { error } = await db()
      .from("categories")
      .update({
        status,
        status_by: status === "available" ? null : actor.actor_name,
        status_at: status === "available" ? null : new Date().toISOString(),
      })
      .eq("id", categoryId);
    if (error) return { ok: false, error: error.message };
    await logActivity({
      wishlist_id: access.wishlist.id,
      category_id: categoryId,
      ...actor,
      type: "status",
      payload: { category: access.category.name, status },
    });
    refresh(access);
    return { ok: true };
  });
}

// --- Links ------------------------------------------------------------------

export async function addLink(categoryId: string, rawUrl: string): Promise<Result<{ link: WishLink }>> {
  return guard<{ link: WishLink }>(async () => {
    const access = await authorizeCategory(categoryId, "admin");
    const url = normalizeUrl(rawUrl);
    if (!url) return { ok: false, error: "That doesn't look like a valid link." };

    const preview = await fetchLinkPreview(url);
    const { data, error } = await db()
      .from("links")
      .insert({ category_id: categoryId, ...preview, title: preview.title || preview.site_name || url.hostname })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };

    await logActivity({
      wishlist_id: access.wishlist.id,
      category_id: categoryId,
      ...(await actorFor(access, "")),
      type: "link_added",
      payload: { category: access.category.name, title: data.title },
    });
    refresh(access);
    return { ok: true, link: { ...(data as WishLink), price: price(data.price) } };
  });
}

export interface LinkInput {
  title: string;
  url: string;
  image_url: string;
  price: number | string | null;
  note: string;
}

export async function updateLink(linkId: string, input: LinkInput): Promise<Result> {
  return guard(async () => {
    const link = await getLink(linkId);
    if (!link) return { ok: false, error: "Link not found." };
    const access = await authorizeCategory(link.category_id, "admin");

    const url = normalizeUrl(input.url);
    if (!url) return { ok: false, error: "That doesn't look like a valid link." };
    const image = input.image_url.trim() ? normalizeUrl(input.image_url) : null;
    const newPrice = price(input.price);

    const { error } = await db()
      .from("links")
      .update({
        url: url.toString(),
        title: String(input.title ?? "").trim().slice(0, 200) || url.hostname,
        image_url: image?.toString() ?? null,
        price: newPrice,
        // A hand-typed price is always GBP.
        currency: newPrice === link.price ? link.currency : newPrice === null ? null : "GBP",
        note: String(input.note ?? "").trim().slice(0, 300),
      })
      .eq("id", linkId);
    if (error) return { ok: false, error: error.message };
    refresh(access);
    return { ok: true };
  });
}

export async function refreshLinkPreview(linkId: string): Promise<Result> {
  return guard(async () => {
    const link = await getLink(linkId);
    if (!link) return { ok: false, error: "Link not found." };
    const access = await authorizeCategory(link.category_id, "admin");
    const url = normalizeUrl(link.url);
    if (!url) return { ok: false, error: "Invalid link." };
    const preview = await fetchLinkPreview(url);
    await db()
      .from("links")
      .update({
        title: preview.title || link.title,
        image_url: preview.image_url ?? link.image_url,
        favicon_url: preview.favicon_url ?? link.favicon_url,
        site_name: preview.site_name ?? link.site_name,
        price: preview.price ?? link.price,
        currency: preview.price !== null ? preview.currency : link.currency,
      })
      .eq("id", linkId);
    refresh(access);
    return { ok: true };
  });
}

export async function deleteLink(linkId: string): Promise<Result> {
  return guard(async () => {
    const link = await getLink(linkId);
    if (!link) return { ok: false, error: "Link not found." };
    const access = await authorizeCategory(link.category_id, "admin");
    await db().from("links").delete().eq("id", linkId);
    refresh(access);
    return { ok: true };
  });
}

export async function toggleFavourite(linkId: string): Promise<Result> {
  return guard(async () => {
    const link = await getLink(linkId);
    if (!link) return { ok: false, error: "Link not found." };
    const access = await authorizeCategory(link.category_id, "admin");
    // Clear first so the one-favourite-per-category index never conflicts.
    await db().from("links").update({ is_favourite: false }).eq("category_id", link.category_id);
    if (!link.is_favourite) {
      await db().from("links").update({ is_favourite: true }).eq("id", linkId);
    }
    refresh(access);
    return { ok: true };
  });
}

// --- Comments ---------------------------------------------------------------

export async function addComment(
  categoryId: string,
  body: string,
  guestName: string,
): Promise<Result> {
  return guard(async () => {
    const access = await authorizeCategory(categoryId, "interact");
    const text = String(body ?? "").trim().slice(0, 1000);
    if (!text) return { ok: false, error: "Write something first." };
    const actor = await actorFor(access, guestName);
    const { error } = await db().from("comments").insert({
      category_id: categoryId,
      author_name: actor.actor_name,
      author_role: actor.actor_role,
      body: text,
    });
    if (error) return { ok: false, error: error.message };
    await logActivity({
      wishlist_id: access.wishlist.id,
      category_id: categoryId,
      ...actor,
      type: "comment",
      payload: { category: access.category.name, excerpt: text.slice(0, 80) },
    });
    refresh(access);
    return { ok: true };
  });
}

export async function deleteComment(commentId: string): Promise<Result> {
  return guard(async () => {
    const comment = await getComment(commentId);
    if (!comment) return { ok: false, error: "Comment not found." };
    const access = await authorizeCategory(comment.category_id, "admin");
    await db().from("comments").delete().eq("id", commentId);
    refresh(access);
    return { ok: true };
  });
}
