"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { findWishlistByPasswordLookup } from "@/lib/data";
import { hashIp, passwordLookupKey, verifyAdminPassword } from "@/lib/passwords";
import { clearSession, setSession } from "@/lib/session";
import { db } from "@/lib/supabase";
import { DEFAULT_THEME } from "@/lib/theme/presets";
import type { Theme } from "@/lib/theme/schema";

export type UnlockResult =
  | { ok: true; href: string; theme: Theme; title: string }
  | { ok: false; error: string };

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 10;

async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return hashIp(ip);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function unlock(password: string): Promise<UnlockResult> {
  const input = String(password ?? "").slice(0, 200);
  if (!input.trim()) return { ok: false, error: "Enter the password you were given." };

  const ipHash = await clientIpHash();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await db()
    .from("unlock_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_FAILURES) {
    return { ok: false, error: "Too many attempts. Take a breather and try again in a few minutes." };
  }

  if (verifyAdminPassword(input)) {
    await setSession({ role: "admin" });
    return { ok: true, href: "/admin", theme: DEFAULT_THEME, title: "Admin" };
  }

  const wishlist = await findWishlistByPasswordLookup(passwordLookupKey(input));
  if (wishlist) {
    await setSession({ role: "guest", wid: wishlist.id, v: wishlist.password_version });
    return { ok: true, href: `/w/${wishlist.slug}`, theme: wishlist.theme, title: wishlist.title };
  }

  // Record the failure, prune old rows, and slow down guessing.
  await db().from("unlock_attempts").insert({ ip_hash: ipHash });
  await db()
    .from("unlock_attempts")
    .delete()
    .lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
  await sleep(600);
  return { ok: false, error: "That password doesn't match any wishlist." };
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}
