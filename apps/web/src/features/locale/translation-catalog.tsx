"use client";

import {
  moonClient,
  type UiLocale,
} from "@moonwitness/moonclient";
import { Alert, Button } from "@moonwitness/ui";
import type {
  UiCatalogMessage,
  UiMessageKey,
} from "ql_i18n/catalogs";
import { uiCatalog as idCatalog } from "ql_i18n/catalogs/id";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type { UiMessageKey };

interface MessageValues {
  [key: string]: string | number;
}

interface TranslationContextValue {
  locale: UiLocale;
  setLocale(locale: UiLocale): void;
  t(this: void, key: UiMessageKey, values?: MessageValues): string;
  tm(key: string, fallback: string): string;
  refresh(locale?: UiLocale): Promise<void>;
}

const GUEST_LOCALE_KEY = "moonwitness.ui-locale";
const TranslationContext = createContext<TranslationContextValue | null>(null);

function interpolate(template: string, values?: MessageValues): string {
  if (!values) return template;
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (placeholder, key: string) =>
    values[key] === undefined ? placeholder : String(values[key]),
  );
}

function formatMessage(
  message: UiCatalogMessage | undefined,
  locale: UiLocale,
  values?: MessageValues,
): string | undefined {
  if (message === undefined) return undefined;
  const template =
    typeof message === "string"
      ? message
      : message.plural[
          typeof values?.count === "number" &&
          new Intl.PluralRules(locale).select(values.count) === "one"
            ? "one"
            : "other"
        ] ??
        message.plural.other ??
        Object.values(message.plural)[0];
  return template === undefined ? undefined : interpolate(template, values);
}

export function TranslationCatalogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, setLocale] = useState<UiLocale>("id");
  const [runtimeCatalogs, setRuntimeCatalogs] = useState<
    Partial<Record<UiLocale, Record<string, UiCatalogMessage>>>
  >({});
  const [englishCatalog, setEnglishCatalog] = useState<
    Readonly<Record<UiMessageKey, UiCatalogMessage>> | null
  >(null);
  const [catalogError, setCatalogError] = useState(false);
  const localeRef = useRef(locale);
  const runtimeCatalogsRef = useRef(runtimeCatalogs);
  const englishCatalogRef = useRef(englishCatalog);
  localeRef.current = locale;
  runtimeCatalogsRef.current = runtimeCatalogs;
  englishCatalogRef.current = englishCatalog;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(GUEST_LOCALE_KEY);
      if (saved === "id" || saved === "en") setLocale(saved);
    } catch (error) {
      console.error("Could not read the saved interface language.", error);
    }
  }, []);

  useEffect(() => {
    if (locale !== "en" || englishCatalogRef.current) return;
    let cancelled = false;
    void import("ql_i18n/catalogs/en")
      .then(({ uiCatalog }) => {
        if (cancelled) return;
        englishCatalogRef.current = uiCatalog;
        setEnglishCatalog(uiCatalog);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error(
          "Could not load the bundled English interface catalog.",
          error,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    setCatalogError(false);
    void moonClient
      .getTranslationCatalog(locale)
      .then(({ entries }) => {
        if (cancelled) return;
        setRuntimeCatalogs((catalogs) => ({
          ...catalogs,
          [locale]: Object.fromEntries(
            entries.map(({ namespace, key, value, pluralForms }) => [
              `${namespace}.${key}`,
              pluralForms ? { plural: pluralForms } : value,
            ]),
          ),
        }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Could not load the published translation catalog.", error);
        setCatalogError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const t = useCallback(
    (key: UiMessageKey, values?: MessageValues) => {
      const activeLocale = localeRef.current;
      const message =
        runtimeCatalogsRef.current[activeLocale]?.[key] ??
        (activeLocale === "en" ? englishCatalogRef.current?.[key] : undefined) ??
        idCatalog[key];
      return formatMessage(message, activeLocale, values) ?? key;
    },
    [],
  );
  const tm = useCallback(
    (key: string, fallback: string) => {
      const activeLocale = localeRef.current;
      const runtimeMessage = runtimeCatalogsRef.current[activeLocale]?.[key];
      const runtimeText = formatMessage(runtimeMessage, activeLocale);
      if (runtimeText !== undefined) return runtimeText;
      const bundledKey = Object.keys(idCatalog).find(
        (candidate): candidate is UiMessageKey => candidate === key,
      );
      return bundledKey ? t(bundledKey) : fallback;
    },
    [t],
  );
  const refresh = useCallback(async (requestedLocale?: UiLocale) => {
    const targetLocale = requestedLocale ?? localeRef.current;
    try {
      const { entries } = await moonClient.getTranslationCatalog(targetLocale);
      setRuntimeCatalogs((catalogs) => ({
        ...catalogs,
        [targetLocale]: Object.fromEntries(
          entries.map(({ namespace, key, value, pluralForms }) => [
            `${namespace}.${key}`,
            pluralForms ? { plural: pluralForms } : value,
          ]),
        ),
      }));
      setCatalogError(false);
    } catch (error) {
      console.error("Could not refresh the published translation catalog.", error);
      setCatalogError(true);
    }
  }, []);
  const context = useMemo(
    () => ({ locale, setLocale, t, tm, refresh }),
    [englishCatalog, locale, refresh, runtimeCatalogs, t, tm],
  );

  return (
    <TranslationContext.Provider value={context}>
      {catalogError && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] text-xs">
          <Alert
            variant="error"
            className="pointer-events-none flex flex-wrap items-center justify-center gap-1"
          >
            {t("web.common.catalogUnavailable")}
            <Button
              className="pointer-events-auto ml-3 underline underline-offset-2"
              onClick={() => void refresh()}
              size="sm"
              type="button"
              variant="ghost"
            >
              {t("web.common.retry")}
            </Button>
          </Alert>
        </div>
      )}
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationCatalog() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error(
      "useTranslationCatalog must be used within TranslationCatalogProvider.",
    );
  }
  return context;
}
