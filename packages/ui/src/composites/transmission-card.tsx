import { cn } from "../lib/utils.js";

export interface TransmissionCardProps {
  title: string;
  source: string;
  excerpt: string;
  href: string;
  badge?: string;
  provenanceLabel?: string;
  readActionLabel?: string;
  className?: string;
}

/**
 * Editorial transmission card bringing the voice of MoonWitness into public Home.
 * Distinct from generic product cards: carries explicit provenance (Scripture, Historical, Reflection),
 * reading context, and a semantic link.
 */
export function TransmissionCard({
  title,
  source,
  excerpt,
  href,
  badge,
  provenanceLabel,
  readActionLabel = "Read Chapter",
  className,
}: TransmissionCardProps) {
  return (
    <article
      className={cn(
        "ql-transmission-card group relative flex flex-col justify-between overflow-hidden border border-hairline bg-panel p-6 md:p-8 transition-all hover:border-acid",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          {badge && (
            <span className="text-xs font-semibold uppercase tracking-widest text-acid">
              {badge}
            </span>
          )}
          {provenanceLabel && (
            <span className="text-xs text-muted font-mono">{provenanceLabel}</span>
          )}
        </div>
        <h3 className="ql-display text-2xl text-ink group-hover:text-acid transition-colors">
          <a href={href} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {title}
          </a>
        </h3>
        <p className="text-xs font-mono text-acid-muted">{source}</p>
        <blockquote className="mt-2 text-sm leading-relaxed text-ink-soft italic border-l-2 border-hairline-strong pl-3">
          &ldquo;{excerpt}&rdquo;
        </blockquote>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-hairline-soft pt-4 text-xs font-semibold tracking-wider text-acid uppercase">
        <span>{readActionLabel}</span>
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
          &rarr;
        </span>
      </div>
    </article>
  );
}
