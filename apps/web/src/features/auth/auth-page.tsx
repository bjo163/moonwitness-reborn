"use client";

import { moonClient } from "@moonwitness/moonclient";
import {
  Alert,
  Button,
  CenteredAuth,
  FormField,
  Input,
} from "@moonwitness/ui";
import { Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type AuthMode = "login" | "register" | "forgot" | "sent" | "reset";

const HEADINGS: Record<AuthMode, string> = {
  login: "Selamat datang kembali",
  register: "Buat akun",
  forgot: "Lupa kata sandi",
  sent: "Cek inbox kamu",
  reset: "Buat kata sandi baru",
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("mode");
    if (requested === "login") setMode("login");
    if (requested === "reset" && params.get("token")) {
      setMode("reset");
      setToken(params.get("token") ?? "");
      // The link is single-use, so keep it out of the address bar and history.
      window.history.replaceState(null, "", window.location.pathname);
      setChecking(false);
      return;
    }
    let cancelled = false;
    void moonClient.currentUser()
      .then(() => {
        if (!cancelled) window.location.replace("/command-center");
      })
      .catch((requestError: unknown) => {
        if (
          !cancelled &&
          (!(requestError instanceof Error) ||
            requestError.message !== "Authentication required.")
        ) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Gagal memeriksa sesi.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await moonClient.register({ name, email, password });
      } else if (mode === "login") {
        await moonClient.login({ email, password });
      } else if (mode === "forgot") {
        // The response is the same shape whether or not the address exists,
        // so this screen always shows the same message.
        await moonClient.requestPasswordReset({ email });
        setPassword("");
        switchMode("sent");
        return;
      } else if (mode === "reset") {
        await moonClient.resetPassword({ token, password });
        setPassword("");
        setToken("");
        switchMode("login");
        setNotice("Kata sandi diperbarui. Silakan masuk.");
        return;
      }
      window.location.assign("/command-center");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Autentikasi gagal.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center text-sm text-stone-500">
        Memeriksa sesi...
      </main>
    );
  }

  const needsNewPassword = mode === "register" || mode === "reset";
  const showEmail = mode !== "reset";
  const showPassword = mode !== "forgot" && mode !== "sent";

  return (
    <CenteredAuth>
      <Link href="/" className="mb-7 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-stone-900 text-white">
          <Sparkles size={18} />
        </span>
        <span>
          <span className="block font-semibold tracking-tight">MoonWitness</span>
          <span className="block text-sm text-stone-500">Command Center</span>
        </span>
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{HEADINGS[mode]}</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        {mode === "forgot"
          ? "Kami kirim tautan untuk mengatur ulang kata sandi kamu."
          : mode === "sent"
            ? "Kalau akun untuk alamat ini ada, tautan reset sudah dikirim. Tautan berlaku 30 menit dan hanya sekali pakai."
            : "Masuk untuk melanjutkan ke ruang kerja pribadi MoonWitness."}
      </p>
      {notice && (
        <p className="mt-4 rounded-lg border border-emerald-700/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {mode === "sent" ? (
        <div className="mt-6">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => switchMode("login")}
          >
            Kembali ke masuk
          </Button>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          {mode === "register" && (
            <FormField label="Nama" htmlFor="auth-name">
              <Input
                id="auth-name"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama kamu"
              />
            </FormField>
          )}
          {showEmail && (
            <FormField label="Email" htmlFor="auth-email">
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
              />
            </FormField>
          )}
          {showPassword && (
            <FormField label="Kata sandi" htmlFor="auth-password">
              <Input
                id="auth-password"
                type="password"
                autoComplete={needsNewPassword ? "new-password" : "current-password"}
                minLength={needsNewPassword ? 12 : undefined}
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={needsNewPassword ? "Minimal 12 karakter" : "Kata sandi akun"}
              />
            </FormField>
          )}
          {error && <Alert variant="error">{error}</Alert>}
          <Button className="w-full" disabled={busy}>
            {busy
              ? "Mohon tunggu..."
              : mode === "register"
                ? "Buat akun"
                : mode === "forgot"
                  ? "Kirim tautan reset"
                  : mode === "reset"
                    ? "Simpan kata sandi baru"
                    : "Masuk"}
          </Button>
        </form>
      )}
      {mode !== "sent" && mode !== "reset" && (
        <p className="mt-5 text-center text-sm text-stone-500">
          {mode === "register" ? (
            <>
              Sudah punya akun?{" "}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => switchMode("login")}
              >
                Masuk
              </Button>
            </>
          ) : mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => switchMode("register")}
              >
                Daftar
              </Button>
              {" · "}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => switchMode("forgot")}
              >
                Lupa kata sandi?
              </Button>
            </>
          ) : mode === "forgot" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => switchMode("login")}
            >
              Kembali ke masuk
            </Button>
          ) : null}
        </p>
      )}
    </CenteredAuth>
  );
}
