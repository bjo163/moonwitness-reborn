import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "error" | "info";
}

export function Alert({
  className,
  variant = "info",
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn("ql-alert", `ql-alert--${variant}`, className)}
      {...props}
    />
  );
}
