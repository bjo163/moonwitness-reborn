import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn("ql-checkbox", className)}
      {...props}
    />
  );
});
