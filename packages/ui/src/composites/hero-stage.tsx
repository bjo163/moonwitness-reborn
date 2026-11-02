import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

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
      <Image
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
