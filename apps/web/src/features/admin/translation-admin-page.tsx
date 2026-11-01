"use client";

import {
  moonClient,
  type AuthUserDto,
  type TranslationAdminItemDto,
  type TranslationPluralCategoryDto,
  type UiLocale,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  CenteredAuth,
  Input,
  Select,
  Textarea,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import { ArrowLeft, Download, Languages, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useLocalePreference } from "../locale/use-locale-preference";
import { useTranslationCatalog } from "../locale/translation-catalog";

type StatusFilter = "all" | "draft" | "published";

function replaceTranslation(
  entries: TranslationAdminItemDto[],
  translation: TranslationAdminItemDto,
): TranslationAdminItemDto[] {
  const index = entries.findIndex((entry) => entry.id === translation.id);
  if (index < 0) return [translation, ...entries];
  return entries.map((entry) => (entry.id === translation.id ? translation : entry));
}

export default function TranslationAdminPage() {
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [targetLocale, setTargetLocale] = useState<UiLocale>("id");
  const [entries, setEntries] = useState<TranslationAdminItemDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [pluralDrafts, setPluralDrafts] = useState<
    Partial<Record<TranslationPluralCategoryDto, string>>
  >({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { locale, changeLocale } = useLocalePreference(user);
  const { t, refresh } = useTranslationCatalog();

  const loadEntries = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await moonClient.listAdminTranslations(targetLocale);
      setEntries(result.translations);
      setSelectedId((current) =>
        current && result.translations.some((entry) => entry.id === current)
          ? current
          : result.translations[0]?.id ?? null,
      );
    } catch (loadError) {
      setError(apiErrorMessage(loadError, t));
    } finally {
      setBusy(false);
    }
  }, [targetLocale, t]);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch((authError: unknown) => {
        if (!cancelled) {
          setUser(null);
          if (
            !(authError instanceof Error && "status" in authError && authError.status === 401)
          ) {
            setError(apiErrorMessage(authError, t));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!user || !user.groups.includes("admin")) return;
    void loadEntries();
  }, [loadEntries, user]);

  const isAdmin = user?.groups.includes("admin") ?? false;
  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  useEffect(() => {
    setDraftText(selected?.value ?? "");
    setPluralDrafts(selected?.translatedPluralTexts ?? {});
  }, [selected?.id, selected?.updatedAt]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return entries.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [
        entry.namespace,
        entry.key,
        entry.sourceText,
        entry.value,
        entry.context,
      ].some((value) => value.toLocaleLowerCase(locale).includes(normalizedQuery));
    });
  }, [entries, locale, query, statusFilter]);

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || working) return;
    let translatedPluralTexts:
      | Partial<Record<"one" | "other", string>>
      | undefined;
    if (typeof selected.sourcePluralText === "string") {
      translatedPluralTexts =
        targetLocale === "en"
          ? { one: pluralDrafts.one ?? "", other: pluralDrafts.other ?? "" }
          : { other: pluralDrafts.other ?? "" };
    }
    const hasIncompleteTranslation =
      typeof selected.sourcePluralText === "string"
        ? Object.values<string>(translatedPluralTexts ?? {}).some(
            (value) => value.trim().length === 0,
          )
        : draftText.trim().length === 0;
    if (hasIncompleteTranslation) {
      return;
    }
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const { translation } = await moonClient.saveTranslationDraft({
        locale: targetLocale,
        namespace: selected.namespace,
        key: selected.key,
        sourceText: selected.sourceText,
        ...(selected.sourcePluralText
          ? { sourcePluralText: selected.sourcePluralText }
          : {}),
        translatedText:
          translatedPluralTexts?.one ??
          translatedPluralTexts?.other ??
          draftText,
        ...(translatedPluralTexts ? { translatedPluralTexts } : {}),
        ...(selected.context ? { context: selected.context } : {}),
      });
      setEntries((current) => replaceTranslation(current, translation));
      setSelectedId(translation.id);
      setNotice(t("web.translationAdmin.statusSaved"));
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
    } finally {
      setWorking(false);
    }
  }

  async function approveSelected() {
    if (!selected || selected.status !== "draft" || working) return;
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const { translation } = await moonClient.approveTranslation(selected.id);
      setEntries((current) => replaceTranslation(current, translation));
      await refresh(targetLocale);
      setNotice(t("web.translationAdmin.statusApproved"));
    } catch (approveError) {
      setError(apiErrorMessage(approveError, t));
    } finally {
      setWorking(false);
    }
  }

  async function createAiDraft() {
    if (!selected || working) return;
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const { translation } = await moonClient.createAiTranslationDraft({
        locale: targetLocale,
        namespace: selected.namespace,
        key: selected.key,
        sourceText: selected.sourceText,
        ...(selected.sourcePluralText
          ? { sourcePluralText: selected.sourcePluralText }
          : {}),
        ...(selected.context ? { context: selected.context } : {}),
      });
      setEntries((current) => replaceTranslation(current, translation));
      setSelectedId(translation.id);
      setNotice(t("web.translationAdmin.statusAiDraft"));
    } catch (draftError) {
      setError(apiErrorMessage(draftError, t));
    } finally {
      setWorking(false);
    }
  }

  async function importPo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const content = await file.text();
      const result = await moonClient.importTranslationPo(targetLocale, content);
      setEntries((current) =>
        result.translations.reduce(replaceTranslation, current),
      );
      setNotice(
        t("web.translationAdmin.statusImported", {
          count: result.translations.length,
        }),
      );
    } catch (importError) {
      setError(
        importError instanceof TypeError
          ? t("web.translationAdmin.fileReadError")
          : apiErrorMessage(importError, t),
      );
    } finally {
      setWorking(false);
    }
  }

  async function exportPo() {
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const { content } = await moonClient.exportTranslationPo(targetLocale);
      const blob = new Blob([content], {
        type: "text/x-gettext-translation;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `moonwitness-${targetLocale}.po`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice(t("web.translationAdmin.statusExported"));
    } catch (exportError) {
      setError(apiErrorMessage(exportError, t));
    } finally {
      setWorking(false);
    }
  }

  if (busy && user === undefined) {
    return (
      <main
        className="ql-hud-app flex min-h-dvh items-center justify-center px-6 text-sm text-stone-500"
        aria-busy="true"
      >
        {t("web.translationAdmin.loading")}
      </main>
    );
  }

  if (!user) {
    return (
      <CenteredAuth>
        <h1 className="text-xl font-semibold text-stone-950">
          {t("web.translationAdmin.signIn")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          {t("web.translationAdmin.description")}
        </p>
        {error && <Alert className="mt-4" variant="error">{error}</Alert>}
        <Button
          className="mt-5 w-full"
          onClick={() => (window.location.href = "/auth")}
        >
          {t("web.translationAdmin.signIn")}
        </Button>
      </CenteredAuth>
    );
  }

  if (!isAdmin) {
    return (
      <CenteredAuth>
        <h1 className="text-xl font-semibold text-stone-950">
          {t("web.translationAdmin.accessDenied")}
        </h1>
        <a
          className="mt-5 inline-flex text-sm font-medium underline underline-offset-4"
          href="/command-center"
        >
          {t("web.translationAdmin.back")}
        </a>
      </CenteredAuth>
    );
  }

  const languageLabel = t(
    targetLocale === "id"
      ? "web.translationAdmin.languageId"
      : "web.translationAdmin.languageEn",
  );

  return (
    <WorkspaceTemplate
      sidebarOpen={false}
      onCloseSidebar={() => undefined}
      closeLabel={t("web.common.closeMenu")}
      sidebar={
        <div className="space-y-5">
          <a
            href="/command-center"
            className="flex h-12 items-center gap-2.5 px-2 font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Languages size={16} aria-hidden="true" />
            </span>
            MoonWitness
          </a>
          <a href="/command-center" className="ql-nav-link">
            <ArrowLeft size={16} aria-hidden="true" />
            {t("web.translationAdmin.back")}
          </a>
          <div className="border-t border-stone-200 px-2 pt-4">
            <p className="truncate text-xs font-medium text-stone-700">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-stone-500">{user.role}</p>
          </div>
        </div>
      }
      header={
        <>
          <span className="text-sm font-medium text-stone-700">
            {t("web.translationAdmin.title")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void changeLocale(locale === "id" ? "en" : "id")}
          >
            {locale.toUpperCase()}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
                {t("web.translationAdmin.title")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {t("web.translationAdmin.description")}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-xs font-medium text-stone-600">
                {t("web.translationAdmin.targetLanguage")}
                <Select
                  className="min-w-40"
                  value={targetLocale}
                  onChange={(event) => {
                    if (event.target.value === "id" || event.target.value === "en") {
                      setTargetLocale(event.target.value);
                    }
                  }}
                >
                  <option value="id">
                    {t("web.translationAdmin.languageId")}
                  </option>
                  <option value="en">
                    {t("web.translationAdmin.languageEn")}
                  </option>
                </Select>
              </label>
              <Button
                type="button"
                variant="secondary"
                disabled={working}
                onClick={() => void exportPo()}
              >
                <Download size={15} aria-hidden="true" />
                {working
                  ? t("web.translationAdmin.exporting")
                  : t("web.translationAdmin.exportPo")}
              </Button>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2">
                <Upload size={15} aria-hidden="true" />
                {working
                  ? t("web.translationAdmin.importing")
                  : t("web.translationAdmin.importPo")}
                <Input
                  className="sr-only"
                  type="file"
                  accept=".po,text/plain"
                  aria-label={t("web.translationAdmin.importPo")}
                  disabled={working}
                  onChange={(event) => void importPo(event)}
                />
              </label>
            </div>
          </header>

          {error && <Alert variant="error">{error}</Alert>}
          {notice && <Alert role="status">{notice}</Alert>}

          <section className="grid min-h-[36rem] gap-6 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)]">
            <div className="flex min-h-0 flex-col border-y border-stone-200 py-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-stone-900">
                  {t("web.translationAdmin.filterLabel")}
                </h2>
                <Badge variant="outline">
                  {t("web.translationAdmin.entries", {
                    count: filteredEntries.length,
                  })}
                </Badge>
              </div>
              <Input
                className="mt-4"
                value={query}
                placeholder={t("web.translationAdmin.search")}
                aria-label={t("web.translationAdmin.filterLabel")}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Select
                className="mt-3"
                aria-label={t("web.translationAdmin.allStatuses")}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value === "draft" ||
                      event.target.value === "published"
                      ? event.target.value
                      : "all",
                  )
                }
              >
                <option value="all">{t("web.translationAdmin.allStatuses")}</option>
                <option value="draft">{t("web.translationAdmin.draftStatus")}</option>
                <option value="published">{t("web.translationAdmin.publishedStatus")}</option>
              </Select>
              <div className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto" aria-busy={busy}>
                {busy ? (
                  <p className="py-5 text-sm text-stone-500" role="status">
                    {t("web.translationAdmin.loading")}
                  </p>
                ) : filteredEntries.length === 0 ? (
                  <p className="py-5 text-sm text-stone-500">
                    {t("web.translationAdmin.noResults")}
                  </p>
                ) : (
                  filteredEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      aria-current={entry.id === selectedId ? "true" : undefined}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        entry.id === selectedId
                          ? "border-lime-700 bg-lime-50"
                          : "border-transparent hover:border-stone-200 hover:bg-stone-50"
                      }`}
                      onClick={() => setSelectedId(entry.id)}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate font-mono text-xs font-semibold text-stone-800">
                          {entry.namespace}.{entry.key}
                        </span>
                        <Badge
                          variant={entry.status === "published" ? "live" : "outline"}
                        >
                          {entry.status === "published"
                            ? t("web.translationAdmin.publishedStatus")
                            : t("web.translationAdmin.draftStatus")}
                        </Badge>
                      </span>
                      <span className="mt-1 block truncate text-sm text-stone-600">
                        {entry.value}
                      </span>
                      <span className="mt-1 block truncate text-xs text-stone-500">
                        {entry.sourceText}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="min-w-0 py-5">
              {selected ? (
                <form className="space-y-5" onSubmit={(event) => void saveDraft(event)}>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
                    <div className="min-w-0">
                      <h2 className="break-all font-mono text-sm font-semibold text-stone-900">
                        {selected.namespace}.{selected.key}
                      </h2>
                      <p className="mt-1 text-xs text-stone-500">
                        {languageLabel} · {selected.status === "draft"
                          ? t("web.translationAdmin.draftStatus")
                          : t("web.translationAdmin.publishedStatus")}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {t(
                        `web.translationAdmin.source${selected.draftSource[0].toUpperCase()}${selected.draftSource.slice(1)}` as
                          | "web.translationAdmin.sourceManual"
                          | "web.translationAdmin.sourceImport"
                          | "web.translationAdmin.sourceAi"
                          | "web.translationAdmin.sourceSeed",
                      )}
                    </Badge>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-stone-600">
                      {t("web.translationAdmin.source")}
                    </label>
                    <p className="rounded-lg bg-stone-100 px-3 py-2.5 text-sm leading-6 text-stone-700">
                      {selected.sourceText}
                    </p>
                  </div>

                  {!selected.sourcePluralText && <div>
                    <label
                      className="mb-1.5 block text-xs font-semibold text-stone-600"
                      htmlFor="translation-value"
                    >
                      {t("web.translationAdmin.translated")}
                    </label>
                    <Textarea
                      id="translation-value"
                      rows={5}
                      maxLength={4000}
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                      aria-describedby="translation-review-notice"
                    />
                  </div>}
                  {selected.sourcePluralText && (
                    <div className="space-y-4">
                      <p className="text-sm leading-6 text-stone-700">
                        {selected.sourcePluralText}
                      </p>
                      {targetLocale === "en" && (
                        <div>
                          <label
                            className="mb-1.5 block text-xs font-semibold text-stone-600"
                            htmlFor="translation-one"
                          >
                            {t("web.translationAdmin.pluralOne")}
                          </label>
                          <Textarea
                            id="translation-one"
                            rows={3}
                            maxLength={4000}
                            value={pluralDrafts.one ?? ""}
                            onChange={(event) =>
                              setPluralDrafts((current) => ({
                                ...current,
                                one: event.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                      <div>
                        <label
                          className="mb-1.5 block text-xs font-semibold text-stone-600"
                          htmlFor="translation-other"
                        >
                          {t("web.translationAdmin.pluralOther")}
                        </label>
                        <Textarea
                          id="translation-other"
                          rows={3}
                          maxLength={4000}
                          value={pluralDrafts.other ?? ""}
                          onChange={(event) =>
                            setPluralDrafts((current) => ({
                              ...current,
                              other: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {selected.context && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-stone-600">
                        {t("web.translationAdmin.context")}
                      </label>
                      <p className="text-sm leading-6 text-stone-600">
                        {selected.context}
                      </p>
                    </div>
                  )}

                  <p id="translation-review-notice" className="text-xs leading-5 text-stone-500">
                    {t("web.translationAdmin.aiReviewNotice")}
                  </p>
                  <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-4">
                    <Button type="submit" disabled={working || !draftText.trim()}>
                      {working
                        ? t("web.translationAdmin.loading")
                        : t("web.translationAdmin.saveDraft")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={working}
                      onClick={() => void createAiDraft()}
                    >
                      {t("web.translationAdmin.aiDraft")}
                    </Button>
                    {selected.status === "draft" && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={working}
                        onClick={() => void approveSelected()}
                      >
                        {t("web.translationAdmin.approve")}
                      </Button>
                    )}
                  </div>
                  {Number.isFinite(Date.parse(selected.updatedAt)) && (
                    <p className="text-xs text-stone-500">
                      {t("web.translationAdmin.updated", {
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(selected.updatedAt)),
                      })}
                    </p>
                  )}
                </form>
              ) : (
                <p className="py-10 text-sm text-stone-500">
                  {t("web.translationAdmin.selectEntry")}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
