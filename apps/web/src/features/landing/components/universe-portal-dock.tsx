"use client";

import { PortalCard } from "@moonwitness/ui";
import { ChevronDown, ChevronRight, Compass, Lock, Moon, Users } from "lucide-react";
import Link from "next/link";
import { useMessages } from "../../locale/messages";
import type { UniversePortalDockProps } from "../types";

export function UniversePortalDock({ className }: UniversePortalDockProps) {
  const copy = useMessages();

  return (
    <div
      id="the-universe"
      className={className ?? "relative mx-auto w-full max-w-7xl px-5 pb-5 md:px-10"}
    >
      <ul className="ql-portal-dock" aria-label={copy.landing.portalsLabel}>
        <li>
          <PortalCard
            href="/corpus"
            title="MoonWitness"
            description={copy.landing.portalMoonWitness}
            icon={<Moon aria-hidden="true" size={22} />}
            arrow={<ChevronRight aria-hidden="true" size={16} />}
          />
        </li>
        <li>
          <PortalCard
            href="#community-dock"
            title="Dock"
            description={copy.landing.portalDock}
            icon={<Users aria-hidden="true" size={22} />}
            arrow={<ChevronRight aria-hidden="true" size={16} />}
            status={copy.common.statusProposed}
          />
        </li>
        <li>
          <PortalCard
            href="/command-center"
            title="Cockpit"
            description={copy.landing.portalCockpit}
            icon={<Compass aria-hidden="true" size={22} />}
            arrow={<ChevronRight aria-hidden="true" size={16} />}
          />
        </li>
        <li>
          <PortalCard
            href="/command-center"
            title="Headquarter"
            description={copy.landing.portalHeadquarter}
            icon={<Lock aria-hidden="true" size={22} />}
            arrow={<ChevronRight aria-hidden="true" size={16} />}
            status={copy.landing.portalHqRestricted}
          />
        </li>
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline pt-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-acid shadow-[0_0_8px_var(--ql-glow-gold)]"
          />
          <span className="text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
            {copy.landing.heroEst}
          </span>
        </div>
        <p className="text-xs font-medium tracking-[0.22em] text-ink-soft">
          {copy.landing.footerValues}
        </p>
        <Link
          href="#explore-knowledge"
          className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold tracking-[0.18em] text-acid uppercase underline-offset-4 hover:underline"
        >
          <span>{copy.landing.scrollCue}</span>
          <ChevronDown aria-hidden="true" size={14} />
        </Link>
      </div>
    </div>
  );
}
