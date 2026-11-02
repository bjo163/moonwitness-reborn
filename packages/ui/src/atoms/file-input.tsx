import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

export interface FileInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** The companion label must bind to this id; the input itself is not painted. */
  id: string;
}

/**
 * The only place a raw file input may live: `apps/web` screens are barred from
 * form primitives, and the picker needs a real input to keep keyboard, touch,
 * and assistive-tech access that a custom dialog cannot guarantee.
 */
export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  function FileInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn("ql-file-input", className)}
        type="file"
        {...props}
      />
    );
  },
);
