import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn("ql-textarea", className)}
      {...props}
    />
  );
});
