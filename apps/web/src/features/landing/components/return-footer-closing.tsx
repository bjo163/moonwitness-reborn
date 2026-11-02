"use client";

import { SpatialRegion } from "@moonwitness/ui";
import { Globe, Lock } from "lucide-react";
import Link from "next/link";
import { useMessages } from "../../locale/messages";
import type { ReturnFooterClosingProps } from "../types";

export function ReturnFooterClosing({
  locale = "id",
  className,
}: ReturnFooterClosingProps & { locale?: string }) {
  const copy = useMessages();

  return (
    <>
      <SpatialRegion
        id="your-journey"
        eyebrow={copy.landing.m7Eyebrow}
        title={copy.landing.m7Title}
        description={copy.landing.m7Description}
        className={className}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between border border-hairline bg-panel p-6 md:p-8">
            <div>
              <span className="inline-flex size-8 items-center justify-center border border-hairline-strong text-acid">
                <Globe aria-hidden="true" size={16} />
              </span>
              <h3 className="ql-display mt-4 text-2xl text-ink">
                {copy.landing.m7AnonTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {copy.landing.m7AnonDesc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline-soft">
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-acid underline-offset-4 hover:underline"
              >
                <span>{copy.landing.m7AnonAction}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between border border-acid/40 bg-panel-raised p-6 md:p-8">
            <div>
              <span className="inline-flex size-8 items-center justify-center border border-acid text-acid">
                <Lock aria-hidden="true" size={16} />
              </span>
              <h3 className="ql-display mt-4 text-2xl text-ink">
                {copy.landing.m7MemberTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {copy.landing.m7MemberDesc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline-soft">
              <Link
                href={`/auth?mode=login&locale=${locale}`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-acid underline-offset-4 hover:underline"
              >
                <span>{copy.landing.login}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </SpatialRegion>

      <footer
        id="the-return"
        className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-16 md:px-10 md:py-24"
      >
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-acid">
            {copy.landing.m8Eyebrow}
          </p>
          <h2 className="ql-display mt-4 text-3xl font-semibold text-ink md:text-5xl">
            {copy.landing.m8Title}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft italic">
            {copy.landing.m8ClosingQuote}
          </p>
          <p className="mt-2 text-xs text-muted">
            {copy.landing.m8FooterReflectionSource}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-medium tracking-wider text-muted">
            <Link
              href="/community"
              className="underline-offset-4 hover:text-acid hover:underline transition-colors"
            >
              {copy.landing.m8EcosystemConstitution}
            </Link>
            <span>&bull;</span>
            <span>{copy.landing.m8Privacy}</span>
            <span>&bull;</span>
            <span>{copy.landing.m8Terms}</span>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-hairline-soft pt-8 text-xs text-muted">
          <p>{copy.landing.footer}</p>
        </div>
      </footer>
    </>
  );
}
