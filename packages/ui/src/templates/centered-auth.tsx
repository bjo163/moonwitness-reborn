import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface CenteredAuthProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function CenteredAuth({
  children,
  className,
  ...props
}: CenteredAuthProps) {
  return (
    <main
      className={cn("ql-hud-auth ql-centered-auth", className)}
      {...props}
    >
      <section className="ql-hud-auth-card ql-centered-auth__card">
        {children}
      </section>
    </main>
  );
}
