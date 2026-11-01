import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

const badgeVariants = cva("ql-badge", {
  variants: {
    variant: {
      default: "ql-badge--default",
      live: "ql-badge--live",
      outline: "ql-badge--outline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
