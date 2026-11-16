import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ink" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  /** Spot colour. One per screen. */
  primary: "bg-accent text-accent-ink hover:brightness-[1.08] active:translate-y-px",
  /** Solid ink, for strong secondary actions. */
  ink: "bg-ink text-bg hover:opacity-90 active:translate-y-px",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-bg",
  ghost: "text-muted hover:text-ink hover:bg-ink/[0.06]",
  danger: "bg-[#c8261b] text-white hover:brightness-110",
};

// Touch-first: everything is at least 40px tall, 48px for primary actions.
const SIZES: Record<Size, string> = {
  sm: "h-10 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-[15px] gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function buttonClasses(variant: Variant = "outline", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap select-none transition-[background-color,color,opacity,filter,transform] duration-150 disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outline", size = "md", className = "", type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});
