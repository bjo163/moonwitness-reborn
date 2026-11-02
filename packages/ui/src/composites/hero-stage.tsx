import Image from "next/image";
import type { ElementType, ReactNode } from "react";
import { cn } from "../lib/utils.js";

// Handle CJS/ESM interop across different module loaders where default may be nested
const NextImage: ElementType =
  typeof Image === "function" || (Image != null && typeof (Image as unknown as { $$typeof: unknown }).$$typeof === "symbol")
    ? (Image as unknown as ElementType)
    : ((Image as unknown as { default?: ElementType })?.default ?? (Image as unknown as ElementType));

export interface HeroStageProps {
  /** Background artwork. It is decorative, so it is hidden from assistive tech. */
  imageSrc: string;
  children: ReactNode;
  className?: string;
}

/**
 * Full-viewport hero with artwork behind the content. The stage is always a
 * night scene, so `.ql-hero` pins its own light-on-dark colour tokens in both
 * themes and a gradient veil keeps the text column legible over the image.
 * The caller supplies every user-facing string through `children`.
 */
export function HeroStage({ imageSrc, children, className }: HeroStageProps) {
  return (
    <section className={cn("ql-hero", className)}>
      <NextImage
        alt=""
        aria-hidden="true"
        className="ql-hero__media"
        fill
        priority
        sizes="100vw"
        src={imageSrc}
      />
      <div aria-hidden="true" className="ql-hero__veil" />
      {children}
    </section>
  );
}
