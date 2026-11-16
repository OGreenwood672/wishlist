import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeShell } from "@/components/theme/theme-shell";
import { buttonClasses } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth";
import { DEFAULT_THEME } from "@/lib/theme/presets";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdminPage();
  return (
    <ThemeShell theme={DEFAULT_THEME}>
      <header className="sticky top-0 z-30 bg-bg/95 border-b border-ink pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 h-14 flex items-center gap-4">
          <Link href="/admin" className="display text-2xl mr-auto">
            Wishlists<span className="text-accent">.</span>
          </Link>
          <Link href="/admin/profile" className={buttonClasses("ghost", "sm")}>
            About me
          </Link>
          <form action={logout}>
            <button type="submit" className={buttonClasses("ghost", "icon")} aria-label="Log out" title="Log out">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 sm:pt-12 pb-safe-bar">{children}</main>
    </ThemeShell>
  );
}
