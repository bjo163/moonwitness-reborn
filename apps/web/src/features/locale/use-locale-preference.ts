"use client";

import { moonClient, type AuthUserDto, type UiLocale } from "@moonwitness/moonclient";
import { useCallback, useEffect, useState } from "react";
import { useTranslationCatalog } from "./translation-catalog";

export const GUEST_LOCALE_KEY = "moonwitness.ui-locale";

export function isUiLocale(value: string | null): value is UiLocale {
  return value === "id" || value === "en";
}

export function useLocalePreference(
  user: AuthUserDto | null | undefined,
) {
  const { setLocale: setCatalogLocale } = useTranslationCatalog();
  const [locale, setLocale] = useState<UiLocale>("id");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
    setCatalogLocale(locale);
  }, [locale, setCatalogLocale]);

  useEffect(() => {
    if (user === undefined) return;
    if (user) {
      setLocale(user.preferredLocale);
      setError(null);
      return;
    }
    try {
      const saved = window.localStorage.getItem(GUEST_LOCALE_KEY);
      if (isUiLocale(saved)) setLocale(saved);
      setError(null);
    } catch (storageError) {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Could not read the saved language preference.",
      );
    }
  }, [user]);

  const changeLocale = useCallback(
    async (nextLocale: UiLocale) => {
      if (user === undefined || saving) return;
      setError(null);
      setSaving(true);
      try {
        if (user) {
          const result = await moonClient.updatePreferredLocale(nextLocale);
          setLocale(result.user.preferredLocale);
        } else {
          window.localStorage.setItem(GUEST_LOCALE_KEY, nextLocale);
          setLocale(nextLocale);
        }
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Could not save the language preference.",
        );
      } finally {
        setSaving(false);
      }
    },
    [saving, user],
  );

  return { locale, changeLocale, saving, error };
}
