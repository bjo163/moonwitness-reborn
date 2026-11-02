"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "dark" | "light";

const THEME_STORAGE_KEY = "mw-theme";

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemePreference>("dark");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        if (stored === "light") {
          document.documentElement.setAttribute("data-theme", "light");
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
      }
    } catch {
      // LocalStorage might be disabled in private browsing; default to dark gracefully
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemePreference = prev === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Ignore quota/security errors
      }
      if (next === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
