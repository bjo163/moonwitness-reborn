"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto as AuthUser,
  type CorpusEditionDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import { Boxes, BookOpen, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMessages } from "../locale/messages";
import { useLocalePreference } from "../locale/use-locale-preference";

/**
 * Corpus shelf — one card per published edition. Every card surfaces its
 * `authority` (revelation_verbatim / translation) and `attribution_text`
 * because MW-ADR-019 forbids rendering text without its kind and attribution;
 * the response DTO carries both non-optionally, so this screen has no way to
 * accidentally hide them either.
 *
 * Editions whose display rights are not cleared never appear in the API
 * response at all (see `packages/ql_corpus/services/reader-service.ts`), so
 * nothing here is CSS-hidden — the deny is server-side.
 */
interface EditionRow extends Record<string, string> {
  id: string;
  edition_key: string;
  canonical_id: string;
  authority_label: string;
  locale: string;
  publisher: string;
  attribution_text: string;
  stage_label: string;
}

function authorityLabel(
  authority: CorpusEditionDto["authority"],
  locale: string,
): string {
  if (authority === "revelation_verbatim") {
    return `Qur'anic text (verbatim, ${locale})`;
  }
  if (authority === "translation") {
    return `Translation (${locale})`;
  }
  return `${authority} (${locale})`;
}

export default function CorpusShelf() {
  const router = useRouter();
  const copy = useMessages();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const { locale } = useLocalePreference(user ?? null);
  const shelfLabel =
    locale === "id" ? "Kitab & Sumber" : "Books & sources";
  const [loading, setLoading] = useState(true);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<CorpusEditionDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser);
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
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Gagal memuat sesi.",
        );
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setShelfLoading(true);
    setError(null);
    void moonClient
      .listCorpusEditions()
      .then((response) => setEditions(response.editions))
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Daftar edisi gagal dimuat.",
        );
      })
      .finally(() => setShelfLoading(false));
  }, [user]);

  if (loading || user === undefined) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center px-6 text-sm text-stone-300">
        <p role="status">{copy.common.loading}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center px-6 text-sm text-stone-300">
        <Alert variant="error">{error ?? "Sesi berakhir."}</Alert>
      </main>
    );
  }

  const rows: EditionRow[] = editions.map((edition) => ({
    id: edition.id,
    edition_key: edition.edition_key,
    canonical_id: edition.canonical_id,
    authority_label: authorityLabel(edition.authority, edition.locale),
    locale: edition.locale,
    publisher: edition.publisher,
    attribution_text: edition.attribution_text,
    stage_label: edition.stage,
  }));

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <>
          <div className="flex h-12 items-center justify-between px-2">
            <Link
              href="/command-center"
              className="ql-hud-brand flex items-center gap-2.5 font-semibold tracking-tight"
            >
              <span className="flex size-8 items-center justify-center rounded-xl border border-[#354135] bg-[#121a13] text-[#d7ff63]">
                <BookOpen aria-hidden="true" size={16} />
              </span>
              MoonWitness
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={copy.common.closeMenu}
              onClick={() => setSidebarOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
          <nav className="mt-6 flex-1 space-y-1" aria-label={copy.common.mainNavigation}>
            <Link
              href="/command-center"
              className="ql-nav-link"
              onClick={() => setSidebarOpen(false)}
            >
              <ShieldCheck aria-hidden="true" size={16} />
              {copy.common.dashboard}
            </Link>
            <Link
              href="/models"
              className="ql-nav-link"
              onClick={() => setSidebarOpen(false)}
            >
              <Boxes aria-hidden="true" size={16} />
              {copy.common.models}
            </Link>
            <Link
              href="/corpus"
              className="ql-nav-link is-active"
              aria-current="page"
              onClick={() => setSidebarOpen(false)}
            >
              <BookOpen aria-hidden="true" size={16} />
              {shelfLabel}
            </Link>
          </nav>
          <div className="mt-4 flex items-center gap-2 border-t border-[#354135] px-2 pt-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-stone-200">
                {user.name}
              </div>
              <div className="truncate text-[11px] text-stone-400">{user.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={copy.common.logout}
              title={copy.common.logout}
              onClick={() => {
                void moonClient.logout().then(() => router.replace("/auth"));
              }}
            >
              <LogOut aria-hidden="true" size={16} />
            </Button>
          </div>
        </>
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={copy.common.openMenu}
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu aria-hidden="true" size={19} />
            </Button>
            <span className="text-sm font-medium text-stone-200">{shelfLabel}</span>
          </div>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
          <header className="border-b border-[#354135] pb-6">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-stone-100 md:text-4xl">
              {shelfLabel}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
              {locale === "id"
                ? "Setiap edisi menampilkan otoritas teks (revelation vs. terjemahan) dan atribusi penerbit. Edisi yang hak tayangnya belum disahkan tidak muncul di daftar ini sama sekali — server tidak mengembalikannya."
                : "Every edition carries its text authority (revelation vs. translation) and publisher attribution. Editions whose display rights are not cleared are absent from this list — the server does not return them."}
            </p>
          </header>

          {error && (
            <Alert variant="error" className="mt-6">
              {error}
            </Alert>
          )}

          {shelfLoading ? (
            <p role="status" className="mt-6 text-sm text-stone-400">
              {locale === "id" ? "Memuat daftar edisi..." : "Loading editions..."}
            </p>
          ) : rows.length === 0 ? (
            <p className="mt-6 text-sm text-stone-400">
              {locale === "id"
                ? "Belum ada edisi yang diterbitkan."
                : "No published editions yet."}
            </p>
          ) : (
            <section className="mt-6 space-y-6">
              <DataTable<EditionRow>
                columns={[
                  { key: "authority_label", label: "Authority" },
                  { key: "publisher", label: "Publisher" },
                  { key: "attribution_text", label: "Attribution" },
                  { key: "stage_label", label: "Stage" },
                ]}
                rows={rows}
                rowKey="id"
                onRowClick={(row) => {
                  router.push(`/corpus/${encodeURIComponent(row.edition_key)}/1`);
                }}
              />
              <div className="grid gap-4 md:grid-cols-2">
                {rows.map((row) => (
                  <Card key={row.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            row.authority_label.startsWith("Qur'anic")
                              ? "live"
                              : "outline"
                          }
                        >
                          {row.authority_label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-stone-300">{row.attribution_text}</p>
                      <p className="mt-2 text-xs text-stone-400">
                        {locale === "id" ? "Penerbit" : "Publisher"}: {row.publisher}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
