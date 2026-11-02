"use client";

import { Badge, SpatialRegion, TransmissionCard } from "@moonwitness/ui";
import { ArrowRight, ChevronRight, FileText, Globe, Scroll, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMessages } from "../../locale/messages";
import type { TransmissionsSanctuaryProps } from "../types";

export function TransmissionsSanctuary({ className }: TransmissionsSanctuaryProps) {
  const copy = useMessages();

  return (
    <>
      <SpatialRegion
        id="transmissions"
        eyebrow={copy.landing.m4Eyebrow}
        title={copy.landing.m4Title}
        description={copy.landing.m4Description}
        className={className}
      >
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <TransmissionCard
            badge="Al-Qur'an · 1:1-7"
            title={copy.landing.m4FeaturedTitle}
            source={copy.landing.m4FeaturedSource}
            excerpt={copy.landing.m4FeaturedExcerpt}
            provenanceLabel={copy.landing.m4ProvenanceLabel}
            readActionLabel={copy.landing.m4ReadAction}
            href="/corpus"
            className="border-hairline-strong shadow-lg"
          />

          <div className="flex flex-col justify-between border border-hairline bg-panel-edge/80 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-acid">
                {copy.landing.m4PrincipleTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {copy.landing.m4PrincipleBody}
              </p>
            </div>
            <div className="mt-6 border-t border-hairline-soft pt-4">
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 text-xs font-medium text-acid underline-offset-4 hover:underline"
              >
                <span>{copy.landing.m4MethodologyAction}</span>
                <ChevronRight aria-hidden="true" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </SpatialRegion>

      <SpatialRegion
        id="discover"
        eyebrow={copy.landing.m5Eyebrow}
        title={copy.landing.m5Title}
        description={copy.landing.m5Description}
      >
        <nav aria-label={copy.landing.m5TopicsAria}>
          <ul className="flex flex-wrap gap-3">
            <li>
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <Globe aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicFaith}
              </Link>
            </li>
            <li>
              <Link
                href="/research"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <Scroll aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicHistory}
              </Link>
            </li>
            <li>
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <FileText aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicWisdom}
              </Link>
            </li>
            <li>
              <Link
                href="/models"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <Sparkles aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicCosmos}
              </Link>
            </li>
          </ul>
        </nav>
      </SpatialRegion>

      <SpatialRegion
        id="community-dock"
        eyebrow={copy.landing.m6Eyebrow}
        title={copy.landing.m6Title}
        description={copy.landing.m6Description}
        actions={<Badge variant="outline">{copy.common.statusProposed}</Badge>}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border border-hairline bg-panel p-6 md:p-8">
            <h3 className="ql-display text-2xl text-ink">
              {copy.landing.m6Pillar1}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {copy.landing.m6Pillar1Desc}
            </p>
          </div>

          <div className="border border-hairline bg-panel p-6 md:p-8">
            <h3 className="ql-display text-2xl text-ink">
              {copy.landing.m6Pillar2}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {copy.landing.m6Pillar2Desc}
            </p>
            <p className="mt-3 text-xs font-medium text-muted">
              [{copy.common.statusProposed}]
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end border-t border-hairline-soft pt-4">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-acid underline-offset-4 hover:underline"
          >
            <span>{copy.landing.m6DockAction}</span>
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </SpatialRegion>
    </>
  );
}
