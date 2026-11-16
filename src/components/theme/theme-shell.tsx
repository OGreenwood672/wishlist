import type { CSSProperties, ReactNode } from "react";
import { themeStyle } from "@/lib/theme/css";
import type { Theme } from "@/lib/theme/schema";

/** Deterministic pseudo-random so server and client render the same particles. */
function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Particles({ theme, count }: { theme: Theme; count: number }) {
  const isSnow = theme.background.pattern === "snow";
  const colors = theme.background.stops;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const size = isSnow ? 2 + rand(i) * 3 : 5 + rand(i) * 5;
        const style = {
          left: `${rand(i + 1) * 100}%`,
          width: size,
          height: isSnow ? size : size * 0.4,
          borderRadius: isSnow ? 999 : 0,
          background: isSnow ? theme.colors.text : colors[i % colors.length],
          opacity: isSnow ? 0.15 + rand(i + 2) * 0.25 : 0.7,
          animationDuration: `${(isSnow ? 18 : 24) + rand(i + 3) * 16}s`,
          animationDelay: `${-rand(i + 4) * 40}s`,
          "--sway": `${(rand(i + 5) - 0.5) * 80}px`,
          "--spin": isSnow ? "0deg" : `${rand(i + 6) * 540}deg`,
        } as CSSProperties;
        return <span key={i} className="falling" style={style} />;
      })}
    </>
  );
}

export function ThemeBackground({ theme, contained = false }: { theme: Theme; contained?: boolean }) {
  const { kind, pattern } = theme.background;
  const position = contained ? "absolute" : "fixed";
  const texture = ["grain", "dots", "grid", "lines"].includes(pattern) ? pattern : null;
  return (
    <div aria-hidden className={`${position} inset-0 -z-10 overflow-hidden pointer-events-none`}>
      <div className="absolute inset-0 bg-bg" />
      {texture && <div className={`absolute inset-0 tex-${texture}`} />}
      {(pattern === "snow" || pattern === "confetti") && (
        <Particles theme={theme} count={contained ? 8 : pattern === "snow" ? 34 : 18} />
      )}
      {kind === "frame" && (
        <div
          className={`absolute border border-ink/25 ${contained ? "inset-2" : "inset-2 sm:inset-3"}`}
          style={{ borderRadius: 2 }}
        />
      )}
    </div>
  );
}

/** Small printed colour bar, like a registration strip on a print proof. */
export function ColorBar({ theme, className = "" }: { theme: Theme; className?: string }) {
  return (
    <span aria-hidden className={`inline-flex ${className}`}>
      {theme.background.stops.map((c, i) => (
        <span key={i} className="h-2.5 w-2.5 border border-ink/15" style={{ background: c }} />
      ))}
    </span>
  );
}

export function ThemeShell({
  theme,
  children,
  className = "",
  contained = false,
}: {
  theme: Theme;
  children: ReactNode;
  className?: string;
  contained?: boolean;
}) {
  return (
    <div
      className={`relative isolate text-ink ${theme.mode === "dark" ? "dark" : ""} ${contained ? "overflow-hidden" : "min-h-dvh"} ${className}`}
      style={themeStyle(theme)}
      data-theme-root={contained ? undefined : ""}
    >
      <ThemeBackground theme={theme} contained={contained} />
      {children}
    </div>
  );
}
