"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type UiLocale,
} from "@moonwitness/moonclient";
import {
  Alert,
  Button,
  CenteredAuth,
  FormField,
  Input,
} from "@moonwitness/ui";
import { Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { apiErrorMessage } from "../locale/api-error-message";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import {
  GUEST_LOCALE_KEY,
  isUiLocale,
} from "../locale/use-locale-preference";

type AuthMode = "login" | "register" | "setup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [locale, setLocale] = useState<UiLocale>("id");
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setLocale: setCatalogLocale, t } = useTranslationCatalog();
  const copy = useMessages();
  const copyRef = useRef(copy);
  copyRef.current = copy;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode: AuthMode =
      params.get("mode") === "login" ? "login" : "register";
    setMode(requestedMode);
    const requestedLocale = params.get("locale");
    try {
      const savedLocale = window.localStorage.getItem(GUEST_LOCALE_KEY);
      let nextLocale: UiLocale;
      if (isUiLocale(requestedLocale)) {
        nextLocale = requestedLocale;
      } else if (isUiLocale(savedLocale)) {
        nextLocale = savedLocale;
      } else {
        nextLocale = "id";
      }
      setLocale(nextLocale);
      setCatalogLocale(nextLocale);
      window.localStorage.setItem(GUEST_LOCALE_KEY, nextLocale);
    } catch (storageError) {
      console.error("Could not save the selected interface language.", storageError);
      setError(copyRef.current.auth.localeSaveError);
    }
    let cancelled = false;
    void moonClient.currentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) {
          setUser(currentUser);
          window.location.replace("/command-center");
        }
      })
      .catch(async (requestError: unknown) => {
        if (cancelled) return;
        setUser(null);
        if (
          requestError instanceof MoonClientError &&
          requestError.status === 401
        ) {
          try {
            const { required } = await moonClient.initialSetupStatus();
            if (!cancelled) setMode(required ? "setup" : requestedMode);
          } catch (setupError: unknown) {
            if (!cancelled) {
              setError(
                apiErrorMessage(setupError, t),
              );
            }
          }
        } else {
          setError(apiErrorMessage(requestError, t));
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setCatalogLocale, t]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function changeAuthLocale(nextLocale: UiLocale) {
    setError(null);
    try {
      window.localStorage.setItem(GUEST_LOCALE_KEY, nextLocale);
      setLocale(nextLocale);
      setCatalogLocale(nextLocale);
    } catch (storageError) {
      console.error("Could not save the selected interface language.", storageError);
      setError(copy.auth.localeSaveError);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "setup") {
        await moonClient.completeInitialSetup({
          name,
          email,
          password,
          preferredLocale: locale,
        });
      } else if (mode === "register") {
        await moonClient.register({
          name,
          email,
          password,
          preferredLocale: locale,
        });
      } else {
        await moonClient.login({ email, password });
      }
      window.location.assign("/command-center");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center text-sm text-stone-500">
        {copy.common.loading}
      </main>
    );
  }

  const isSetup = mode === "setup";
  const needsNewPassword = mode !== "login";

  let pageTitle: string;
  if (isSetup) {
    pageTitle = copy.auth.setupTitle;
  } else if (mode === "login") {
    pageTitle = copy.auth.loginTitle;
  } else {
    pageTitle = copy.auth.registerTitle;
  }

  let buttonText: string;
  if (busy) {
    buttonText = copy.auth.busy;
  } else if (isSetup) {
    buttonText = copy.auth.setupAction;
  } else if (mode === "register") {
    buttonText = copy.auth.registerAction;
  } else {
    buttonText = copy.auth.loginAction;
  }

  return (
    <CenteredAuth>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/?locale=${locale}`} className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-[#354135] bg-[#121a13] text-[#d7ff63]">
            <Sparkles aria-hidden="true" size={18} />
          </span>
          <span>
            <span className="block font-semibold tracking-tight">MoonWitness</span>
            <span className="block text-sm text-stone-500">{copy.common.dashboard}</span>
          </span>
        </Link>
        <LocaleSwitcher
          locale={locale}
          label={copy.common.localeLabel}
          onChange={changeAuthLocale}
          disabled={checking || Boolean(user)}
        />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        {isSetup ? copy.auth.setupDescription : copy.auth.loginDescription}
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        {mode !== "login" && (
          <FormField label={copy.auth.name} htmlFor="auth-name">
            <Input
              id="auth-name"
              autoComplete="name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.auth.namePlaceholder}
            />
          </FormField>
        )}
        <FormField label={copy.auth.email} htmlFor="auth-email">
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.auth.emailPlaceholder}
          />
        </FormField>
        <FormField label={copy.auth.password} htmlFor="auth-password">
          <Input
            id="auth-password"
            type="password"
            autoComplete={needsNewPassword ? "new-password" : "current-password"}
            minLength={needsNewPassword ? 12 : undefined}
            required
            maxLength={256}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              needsNewPassword
                ? copy.auth.passwordMinimum
                : copy.auth.passwordPlaceholder
            }
          />
        </FormField>
        {error && <Alert variant="error">{error}</Alert>}
        <Button className="w-full" disabled={busy}>{buttonText}</Button>
      </form>
      {isSetup ? (
        <p className="mt-5 text-center text-sm text-stone-500">
          {copy.auth.setupSecurityNote}
        </p>
      ) : (
        <p className="mt-5 text-center text-sm text-stone-500">
          {mode === "register" ? (
            <>
              {copy.auth.existingAccount}{" "}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => switchMode("login")}
              >
                {copy.auth.loginLink}
              </Button>
            </>
          ) : (
            <>
              {copy.auth.newAccount}{" "}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => switchMode("register")}
              >
                {copy.auth.registerLink}
              </Button>
            </>
          )}
        </p>
      )}
    </CenteredAuth>
  );
}
