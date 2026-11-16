"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { unlock, type UnlockResult } from "@/app/actions/auth";
import { themeStyle } from "@/lib/theme/css";

type Success = Extract<UnlockResult, { ok: true }>;

export function UnlockForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [pending, startTransition] = useTransition();
  const shake = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await unlock(password);
      if (!result.ok) {
        setError(result.error);
        shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.35 } });
        inputRef.current?.select();
        return;
      }
      setSuccess(result);
      router.prefetch(result.href);
      setTimeout(() => router.replace(result.href), 1100);
    });
  }

  return (
    <>
      <div className="flex-1 grid grid-cols-[minmax(0,1fr)] content-end sm:content-center py-10 sm:py-16">
        <div className="max-w-4xl min-w-0">
          <h1 className="display text-[clamp(3.75rem,16vw,9.5rem)] rise">
            A wishlist,
            <br />
            <em className="text-accent">by invitation.</em>
          </h1>

          <motion.form animate={shake} onSubmit={submit} className="mt-10 sm:mt-14 max-w-lg rise" style={{ animationDelay: "120ms" }}>
            <label htmlFor="password" className="label block mb-2">
              Password
            </label>
            <div className="flex items-stretch gap-2">
              <input
                id="password"
                ref={inputRef}
                type="password"
                autoFocus
                autoComplete="current-password"
                enterKeyHint="go"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 min-w-0 h-14 bg-transparent border-0 border-b-2 border-ink text-2xl px-0 outline-none focus-visible:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
                placeholder="••••••••"
              />
              <button
                type="submit"
                disabled={pending || !password}
                aria-label="Unlock"
                className="h-14 w-14 shrink-0 rounded-md bg-ink text-bg grid place-items-center transition-[opacity,transform] hover:opacity-90 active:translate-y-px disabled:opacity-25"
              >
                {pending ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={22} />}
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-[15px] text-accent"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>
        </div>
      </div>

      <AnimatePresence>{success && <UnlockReveal success={success} />}</AnimatePresence>
    </>
  );
}

/** The wishlist's own paper slides up over the screen, like turning to its page. */
function UnlockReveal({ success }: { success: Success }) {
  const { theme } = success;
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-bg text-ink flex flex-col justify-end p-5 sm:p-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      style={themeStyle(theme)}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}>
        <div className="label mb-3">Opening</div>
        <div className="display text-[clamp(3rem,11vw,8rem)]">
          {success.title}
          <span className="ml-3 align-top text-[0.5em]">{theme.emoji.mark}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
