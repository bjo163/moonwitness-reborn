"use client";

import { Badge, Button } from "@moonwitness/ui";
import { ArrowRight, Boxes, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="ql-hud-app min-h-dvh">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-stone-900 text-white">
            <Sparkles size={18} />
          </span>
          MoonWitness
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => (window.location.href = "/auth?mode=login")}>Masuk</Button>
          <Button onClick={() => (window.location.href = "/auth")}>
            Mulai sekarang <ArrowRight size={16} />
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[72dvh] w-full max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-10">
        <div>
          <Badge variant="live">AI workspace · Early foundation</Badge>
          <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.05em] text-stone-950 md:text-7xl">
            Satu ruang kerja untuk membangun <span className="text-stone-500">kemungkinan baru.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 md:text-lg">
            MoonWitness menyatukan percakapan AI, model data yang dapat diperluas, dan koneksi provider dalam satu command center yang kamu kendalikan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="default" onClick={() => (window.location.href = "/auth")}>
              Buka Command Center <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/auth?mode=login")}>
              Saya sudah punya akun
            </Button>
          </div>
          <p className="mt-5 text-xs text-stone-500">
            Fondasi platform AI yang berkembang bertahap—bukan klaim bahwa AGI telah tercapai.
          </p>
        </div>

        <div className="grid gap-4">
          <article className="rounded-3xl border border-stone-800 bg-[#101510] p-6 text-stone-100 shadow-[8px_8px_0_#d7ff63] md:p-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d7ff63]">Workspace / 01</span>
              <span className="size-2 rounded-full bg-[#d7ff63]" />
            </div>
            <div className="mt-12 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center border border-stone-700 bg-stone-900">
                <Sparkles size={19} className="text-[#d7ff63]" />
              </span>
              <div>
                <p className="text-sm font-medium">Command Center</p>
                <p className="mt-1 text-xs text-stone-400">Private AI workspace</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <div className="h-2 w-11/12 bg-stone-700" />
              <div className="h-2 w-3/4 bg-stone-800" />
              <div className="h-2 w-4/5 bg-stone-800" />
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="border border-stone-800 p-4">
                <Boxes size={17} className="text-[#d7ff63]" />
                <p className="mt-3 text-xs text-stone-300">Addon data models</p>
              </div>
              <div className="border border-stone-800 p-4">
                <KeyRound size={17} className="text-[#d7ff63]" />
                <p className="mt-3 text-xs text-stone-300">Provider fallback</p>
              </div>
            </div>
          </article>
          <p className="text-right text-[11px] uppercase tracking-[0.14em] text-stone-500">Observe · Connect · Build</p>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-2 border-t border-stone-200 px-5 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between md:px-10">
        <span>MoonWitness — AI platform foundation</span>
        <span>Private by design · Extensible by addons</span>
      </footer>
    </main>
  );
}
