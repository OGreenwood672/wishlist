"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MOBILE_QUERY = "(max-width: 639px)";

function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

/**
 * Bottom sheet on phones (thumb reach, drag down to dismiss),
 * centred panel on larger screens.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const mobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <ThemedPortalRoot>
          <motion.div
            className="fixed inset-0 z-50 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={`pointer-events-auto w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[90dvh] flex flex-col bg-bg text-ink border-t sm:border border-line rounded-t-[14px] sm:rounded-lg shadow-[0_-10px_40px_rgba(0,0,0,0.15)]`}
              initial={mobile ? { y: "100%" } : { opacity: 0, y: 12 }}
              animate={mobile ? { y: 0 } : { opacity: 1, y: 0 }}
              exit={mobile ? { y: "100%" } : { opacity: 0, y: 8 }}
              transition={{ type: "tween", duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              drag={mobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={onDragEnd}
            >
              {mobile && <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ink/20 shrink-0" />}
              <div className="flex items-center justify-between px-5 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-line shrink-0">
                <h2 className="display text-2xl">{title}</h2>
                <button
                  onClick={onClose}
                  className="h-10 w-10 -mr-2 grid place-items-center rounded-md text-muted hover:text-ink hover:bg-ink/[0.06]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {children}
              </div>
            </motion.div>
          </div>
        </ThemedPortalRoot>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Portals escape the ThemeShell, so copy its CSS variables onto the portal root. */
function ThemedPortalRoot({ children }: { children: ReactNode }) {
  const shell = document.querySelector<HTMLElement>("[data-theme-root]");
  const vars = shell
    ? Object.fromEntries(
        Array.from(shell.style)
          .filter((p) => p.startsWith("--"))
          .map((p) => [p, shell.style.getPropertyValue(p)]),
      )
    : undefined;
  return (
    <div className={shell?.classList.contains("dark") ? "dark" : undefined} style={vars as CSSProperties | undefined}>
      {children}
    </div>
  );
}
