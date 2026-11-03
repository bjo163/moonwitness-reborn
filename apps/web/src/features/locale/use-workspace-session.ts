import { useEffect, useState } from "react";
import {
  MoonClientError,
  moonClient,
  type AuthUserDto,
} from "@moonwitness/moonclient";
import { useRouter } from "next/navigation";
import { apiErrorMessage } from "./api-error-message";
import { useTranslationCatalog } from "./translation-catalog";

export interface UseWorkspaceSessionReturn {
  user: AuthUserDto | null | undefined;
  loading: boolean;
  error: string | null;
  locale: string;
  changeLocale(locale: string): void;
  logout(): void;
}

export function useWorkspaceSession(
  user?: AuthUserDto | null
): UseWorkspaceSessionReturn {
  const [userState, setUserState] = useState<AuthUserDto | null | undefined>(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState("id");
  const router = useRouter();
  const { t } = useTranslationCatalog();

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(({ user: currentUser }) => {
        if (cancelled) return;
        setUserState(currentUser);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (
          requestError instanceof MoonClientError &&
          requestError.status === 401
        ) {
          router.replace("/auth");
          return;
        }
        setError(apiErrorMessage(requestError, t));
        setUserState(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, t]);

  useEffect(() => {
    if (userState) {
      setLocale(userState.preferredLocale ?? "id");
    }
  }, [userState]);

  const changeLocale = (nextLocale: string) => {
    if (nextLocale !== "id" && nextLocale !== "en") return;
    setLocale(nextLocale);
    try {
      void moonClient.updatePreferredLocale(nextLocale);
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setError(null);
    void moonClient
      .logout()
      .then(() => router.replace("/auth"))
      .catch((logoutError: unknown) => {
        setError(apiErrorMessage(logoutError, t));
      });
  };

  return { user: userState, loading, error, locale, changeLocale, logout };
}