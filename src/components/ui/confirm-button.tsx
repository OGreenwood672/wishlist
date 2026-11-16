"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";

/** Two-step destructive button: first click arms it, second click confirms. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "Really?",
  ...props
}: Omit<ButtonProps, "onClick"> & {
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      {...props}
      variant={armed ? "danger" : props.variant}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
