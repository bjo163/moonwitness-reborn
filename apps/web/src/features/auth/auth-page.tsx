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

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "login") {
      setMode("login");
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await moonClient.register({ name, email, password });
      } else {
        await moonClient.login({ email, password });
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
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "register" ? "Buat akun" : "Selamat datang kembali"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        Masuk untuk melanjutkan ke ruang kerja pribadi MoonWitness.
      </p>
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
        <FormField label="Kata sandi" htmlFor="auth-password">
          <Input
            id="auth-password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 12 : undefined}
            required
            maxLength={256}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "register" ? "Minimal 12 karakter" : "Kata sandi akun"}
          />
        </FormField>
        {error && <Alert variant="error">{error}</Alert>}
        <Button className="w-full" disabled={busy}>
          {busy ? "Mohon tunggu..." : mode === "register" ? "Buat akun" : "Masuk"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-500">
        {mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError(null);
          }}
        >
          {mode === "register" ? "Masuk" : "Daftar"}
        </Button>
      </p>
    </CenteredAuth>
  );
}
