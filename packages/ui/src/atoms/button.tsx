import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

const buttonVariants = cva("ql-button", {
  variants: {
    variant: {
      default: "ql-button--default",
      secondary: "ql-button--secondary",
      ghost: "ql-button--ghost",
      danger: "ql-button--danger",
    },
    size: {
      default: "ql-button--default-size",
      icon: "ql-button--icon",
      sm: "ql-button--sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
