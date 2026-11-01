import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={cn("ql-card", className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ql-card__header", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ql-card__content", className)} {...props} />;
}
