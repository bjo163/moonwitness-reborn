import type { AuthUserDto, LandingViewSection, UiLocale } from "@moonwitness/moonclient";
import type { UiMessageKey } from "../locale/translation-catalog";

export interface LandingSectionConfig {
  section: LandingViewSection;
  titleKey: UiMessageKey;
  descriptionKey: UiMessageKey;
}

export interface HeroArrivalStageProps {
  user: AuthUserDto | null | undefined;
  brandName: string;
  brandEcosystem: string;
  brandDeclaration: string;
  locale: UiLocale;
  theme: "light" | "dark";
  dashboardHref: string;
  loadErrorMessage: string | null;
  localeError: unknown;
  savingLocale: boolean;
  onOpenSearch(this: void): void;
  onToggleTheme(this: void): void;
  onChangeLocale(this: void, nextLocale: UiLocale): void;
  className?: string;
}

export interface UniversePortalDockProps {
  activeSection?: LandingViewSection;
  className?: string;
}

export interface ExploreKnowledgeTreasuryProps {
  className?: string;
}

export interface TransmissionsSanctuaryProps {
  className?: string;
}

export interface ReturnFooterClosingProps {
  brandName?: string;
  brandDeclaration?: string;
  className?: string;
}
