"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import {
  MIN_PASSWORD_LENGTH,
  encryptPassword,
  normalizeWishlistPassword,
  passwordLookupKey,
  suggestPassphrase,
  verifyAdminPassword,
} from "@/lib/passwords";
import { db } from "@/lib/supabase";
import { generateTheme, parseSubmittedTheme, type GenerateResult } from "@/lib/theme/generate";
import type { ProfileSection } from "@/lib/types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function generateThemeAction(input: {
  title: string;
  description: string;
  avoid?: string;
}): Promise<GenerateResult> {
  await assertAdmin();
  return generateTheme({
    title: String(input.title ?? "").slice(0, 120) || "My wishlist",
    description: String(input.description ?? "").slice(0, 600),
    avoid: input.avoid?.slice(0, 60),
  });
}

export async function suggestPasswordAction(): Promise<string> {
  await assertAdmin();
  return suggestPassphrase();
}

function validatePassword(password: string): string | null {
  const normalized = normalizeWishlistPassword(password);
  if (normalized.length < MIN_PASSWORD_LENGTH) {
    return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (verifyAdminPassword(password)) {
    return "That's your admin password. Pick something different for guests.";
  }
  return null;
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  const { data } = await db().from("wishlists").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug as string));
  if (!taken.has(base) && base !== "new") return base;
  for (let i = 2; ; i++) {
    if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  }
}

export async function saveWishlist(input: {
  id?: string;
  title: string;
  description: string;
  password: string;
  theme: unknown;
}): Promise<Result<{ slug: string }>> {
  await assertAdmin();

  const title = String(input.title ?? "").trim().slice(0, 80);
  const description = String(input.description ?? "").trim().slice(0, 600);
  const password = String(input.password ?? "");
  const theme = parseSubmittedTheme(input.theme);

  if (!title) return { ok: false, error: "Give the wishlist a title." };
  if (!theme) return { ok: false, error: "The theme looks invalid. Try regenerating it." };

  const passwordChanged = password.trim().length > 0;
  if (!input.id && !passwordChanged) return { ok: false, error: "Set a password for guests." };
  if (passwordChanged) {
    const problem = validatePassword(password);
    if (problem) return { ok: false, error: problem };
  }

  const passwordFields = passwordChanged
    ? { password_lookup: passwordLookupKey(password), password_encrypted: encryptPassword(password) }
    : {};

  let slug: string;
  let error: { code?: string; message: string } | null;

  if (input.id) {
    const { data: current } = await db()
      .from("wishlists")
      .select("slug, password_lookup, password_version")
      .eq("id", input.id)
      .single();
    if (!current) return { ok: false, error: "Wishlist not found." };
    slug = current.slug;
    const bump =
      passwordChanged && passwordFields.password_lookup !== current.password_lookup
        ? { password_version: current.password_version + 1 }
        : {};
    ({ error } = await db()
      .from("wishlists")
      .update({ title, description, theme, ...passwordFields, ...bump })
      .eq("id", input.id));
  } else {
    slug = await uniqueSlug(title);
    ({ error } = await db()
      .from("wishlists")
      .insert({ slug, title, description, theme, ...passwordFields }));
  }

  if (error?.code === "23505") {
    return { ok: false, error: "Another wishlist already uses that password." };
  }
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath(`/w/${slug}`, "layout");
  return { ok: true, slug };
}

export async function setWishlistArchived(id: string, archived: boolean): Promise<void> {
  await assertAdmin();
  await db().from("wishlists").update({ is_archived: archived }).eq("id", id);
  revalidatePath("/admin");
}

export async function deleteWishlist(id: string): Promise<void> {
  await assertAdmin();
  await db().from("wishlists").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function saveProfile(input: {
  owner_name: string;
  sections: ProfileSection[];
}): Promise<Result> {
  await assertAdmin();
  const sections = (Array.isArray(input.sections) ? input.sections : [])
    .map((s) => ({
      label: String(s?.label ?? "").trim().slice(0, 40),
      value: String(s?.value ?? "").trim().slice(0, 400),
    }))
    .filter((s) => s.label && s.value)
    .slice(0, 20);

  const { error } = await db()
    .from("profile")
    .update({
      owner_name: String(input.owner_name ?? "").trim().slice(0, 40),
      sections,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
