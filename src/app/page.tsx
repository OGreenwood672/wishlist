import { redirect } from "next/navigation";
import { UnlockForm } from "@/components/unlock-form";
import { ColorBar, ThemeShell } from "@/components/theme/theme-shell";
import { getCurrentSession } from "@/lib/auth";
import { getWishlistById } from "@/lib/data";
import { DEFAULT_THEME } from "@/lib/theme/presets";

export default async function UnlockPage() {
  const session = await getCurrentSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "guest") {
    const wishlist = await getWishlistById(session.wid);
    if (wishlist && wishlist.password_version === session.v) redirect(`/w/${wishlist.slug}`);
  }

  return (
    <ThemeShell theme={DEFAULT_THEME}>
      <main className="min-h-dvh flex flex-col px-5 sm:px-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between border-b border-ink pb-3">
          <span className="label text-ink">Private list</span>
          <span className="label">By invitation · {new Date().getFullYear()}</span>
        </header>

        <UnlockForm />

        <footer className="flex items-center justify-between border-t border-line pt-3">
          <span className="label">Ask whoever sent you here for the password.</span>
          <span className="hidden sm:block">
            <ColorBar theme={DEFAULT_THEME} />
          </span>
        </footer>
      </main>
    </ThemeShell>
  );
}
