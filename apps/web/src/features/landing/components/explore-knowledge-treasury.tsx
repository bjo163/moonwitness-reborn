"use client";

import { SpatialRegion } from "@moonwitness/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMessages } from "../../locale/messages";
import type { ExploreKnowledgeTreasuryProps } from "../types";

export function ExploreKnowledgeTreasury({ className }: ExploreKnowledgeTreasuryProps) {
  const copy = useMessages();

  return (
    <SpatialRegion
      id="explore-knowledge"
      eyebrow={copy.landing.m3Eyebrow}
      title={copy.landing.m3Title}
      description={copy.landing.m3Description}
      className={className}
    >
      <ol
        className="divide-y divide-hairline border-y border-hairline"
        aria-label={copy.landing.m3DirectoryAria}
      >
        <li>
          <Link
            href="/corpus"
            className="group flex items-center gap-6 py-6 px-2 transition-colors hover:bg-panel-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          >
            <span
              className="ql-display shrink-0 w-10 text-3xl font-bold text-hairline-strong group-hover:text-acid-muted transition-colors select-none"
              aria-hidden="true"
            >
              01
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="ql-display text-xl text-ink group-hover:text-acid">
                {copy.landing.m3CorpusTitle}
              </h3>
              <p className="text-sm text-muted">{copy.landing.m3CorpusDesc}</p>
            </div>
            <span
              className="shrink-0 text-acid opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            >
              <ArrowRight size={20} />
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/research"
            className="group flex items-center gap-6 py-6 px-2 transition-colors hover:bg-panel-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          >
            <span
              className="ql-display shrink-0 w-10 text-3xl font-bold text-hairline-strong group-hover:text-acid-muted transition-colors select-none"
              aria-hidden="true"
            >
              02
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="ql-display text-xl text-ink group-hover:text-acid">
                {copy.landing.m3ResearchTitle}
              </h3>
              <p className="text-sm text-muted">{copy.landing.m3ResearchDesc}</p>
            </div>
            <span
              className="shrink-0 text-acid opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            >
              <ArrowRight size={20} />
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/models"
            className="group flex items-center gap-6 py-6 px-2 transition-colors hover:bg-panel-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          >
            <span
              className="ql-display shrink-0 w-10 text-3xl font-bold text-hairline-strong group-hover:text-acid-muted transition-colors select-none"
              aria-hidden="true"
            >
              03
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="ql-display text-xl text-ink group-hover:text-acid">
                {copy.landing.m3ModelsTitle}
              </h3>
              <p className="text-sm text-muted">{copy.landing.m3ModelsDesc}</p>
            </div>
            <span
              className="shrink-0 text-acid opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            >
              <ArrowRight size={20} />
            </span>
          </Link>
        </li>
      </ol>
    </SpatialRegion>
  );
}
