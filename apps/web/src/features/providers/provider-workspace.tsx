"use client";

import {
  MoonClientError,
  moonClient,
  type AuthUserDto as AuthUser,
  type ModelProviderDto as Provider,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  CenteredAuth,
  EmptyState,
  FormField,
  IconTile,
  Input,
  LoadingScreen,
  PageHeader,
  SectionGrid,
  WorkspaceSidebar,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import { ArrowDown, ArrowLeft, ArrowUp, KeyRound, Plus, Save, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

interface ProviderDraft {
  id?: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  enabled: boolean;
}

const emptyDraft: ProviderDraft = {
  name: "",
  baseUrl: "https://api.openai.com/v1",
  model: "",
  apiKey: "",
  enabled: true,
};

export default function ProviderWorkspace() {
  const [user, setUser] = useState<AuthUser | null>(null);
  useLocalePreference(user);
  const { t } = useTranslationCatalog();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [draft, setDraft] = useState<ProviderDraft>(emptyDraft);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    const result = await moonClient.listProviders();
    setProviders(result.providers);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const session = await moonClient.currentUser();
        if (cancelled) return;
        setUser(session.user);
        await loadProviders();
      } catch (loadError) {
        if (
          !cancelled &&
          !(loadError instanceof MoonClientError && loadError.status === 401)
        ) {
          setError(apiErrorMessage(loadError, t));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadProviders, t]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { id, ...values } = draft;
      const update = id !== undefined;
      if (update) {
        await moonClient.updateProvider(id, values);
      } else {
        await moonClient.createProvider(values);
      }
      await loadProviders();
      setDraft(emptyDraft);
      setNotice(t(update ? "web.providers.updatedNotice" : "web.providers.addedNotice"));
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  }

  async function remove(provider: Provider) {
    if (!window.confirm(t("web.providers.confirmDelete", { name: provider.name }))) return;
    setError(null);
    try {
      await moonClient.deleteProvider(provider.id);
      await loadProviders();
      if (draft.id === provider.id) setDraft(emptyDraft);
      setNotice(t("web.providers.deletedNotice"));
    } catch (removeError) {
      setError(apiErrorMessage(removeError, t));
    }
  }

  async function move(provider: Provider, direction: -1 | 1) {
    const next = [...providers];
    const index = next.findIndex(({ id }) => id === provider.id);
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await Promise.all(
        next.map((item, priority) =>
          moonClient.updateProvider(item.id, {
            name: item.name,
            baseUrl: item.baseUrl,
            model: item.model,
            enabled: item.enabled,
            priority,
          }),
        ),
      );
      await loadProviders();
    } catch (moveError) {
      setError(apiErrorMessage(moveError, t));
      await loadProviders();
    }
  }

  if (busy) {
    return <LoadingScreen label={t("web.providers.loading")} />;
  }

  if (!user) {
    return (
      <CenteredAuth>
        <h1 className="text-xl font-semibold">{t("web.providers.signIn")}</h1>
        <p className="mt-2 text-sm text-muted">{t("web.providers.description")}</p>
        <Button className="mt-5 w-full" onClick={() => (window.location.href = "/auth")}>{t("web.auth.loginAction")}</Button>
      </CenteredAuth>
    );
  }

  let providerButtonLabel: string;
  if (saving) {
    providerButtonLabel = t("web.providers.saving");
  } else if (draft.id) {
    providerButtonLabel = t("web.providers.save");
  } else {
    providerButtonLabel = t("web.providers.add");
  }

  return (
    <WorkspaceTemplate
      sidebarOpen={false}
      onCloseSidebar={() => undefined}
      closeLabel={t("web.common.closeMenu")}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<KeyRound aria-hidden="true" size={16} />}
          closeLabel={t("web.common.closeMenu")}
          identity={{ name: user.name, subtitle: user.email }}
          items={[
            {
              href: "/command-center/chat",
              label: t("web.providers.back"),
              icon: <ArrowLeft aria-hidden="true" size={16} />,
            },
          ]}
          navLabel={t("web.providers.title")}
          onCloseSidebar={() => undefined}
        />
      }
      header={<><div className="text-sm font-medium text-ink-soft">{t("web.providers.modelGateway")}</div><Badge variant="live">{t("web.providers.personal")}</Badge></>}
    >
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl space-y-7">
          <PageHeader
            description={t("web.providers.intro")}
            eyebrow={t("web.providers.eyebrow")}
            title={t("web.providers.title")}
          />

          {error && <Alert variant="error">{error}</Alert>}
          {notice && <Alert>{notice}</Alert>}

          <section className="space-y-3" aria-label={t("web.providers.savedProviders")}>
            {providers.length === 0 && (
              <EmptyState title={t("web.providers.empty")} />
            )}
            {providers.map((provider, index) => (
              <article key={provider.id} className="ql-card flex flex-wrap items-center gap-4 p-4">
                <IconTile tone="plain"><KeyRound aria-hidden="true" size={17} /></IconTile>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-ink">{provider.name}</h2>
                    <Badge variant={provider.enabled ? "live" : "default"}>{provider.enabled ? t("web.providers.active") : t("web.providers.inactive")}</Badge>
                    <span className="text-xs text-muted">{t("web.providers.priority", { number: index + 1 })}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{provider.model} · {provider.baseUrl}</p>
                  <p className="mt-1 text-[11px] text-muted">{provider.hasApiKey ? t("web.providers.keyStored") : t("web.providers.keyMissing")}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label={t("web.providers.raisePriority")} disabled={index === 0} onClick={() => void move(provider, -1)}><ArrowUp size={16} /></Button>
                  <Button variant="ghost" size="icon" aria-label={t("web.providers.lowerPriority")} disabled={index === providers.length - 1} onClick={() => void move(provider, 1)}><ArrowDown size={16} /></Button>
                  <Button variant="secondary" size="sm" onClick={() => setDraft({ id: provider.id, name: provider.name, baseUrl: provider.baseUrl, model: provider.model, apiKey: "", enabled: provider.enabled })}>{t("web.providers.edit")}</Button>
                  <Button variant="ghost" size="icon" aria-label={t("web.providers.delete", { name: provider.name })} onClick={() => void remove(provider)}><Trash2 size={16} /></Button>
                </div>
              </article>
            ))}
          </section>

          <form onSubmit={(event) => void save(event)} className="ql-card p-5 md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{draft.id ? t("web.providers.editTitle") : t("web.providers.addTitle")}</h2>
                <p className="mt-1 text-sm text-muted">{t("web.providers.securityNote")}</p>
              </div>
              {draft.id && <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(emptyDraft)}>{t("web.providers.cancelEdit")}</Button>}
            </div>
            <SectionGrid>
              <FormField label={t("web.providers.name")} htmlFor="provider-name">
                <Input id="provider-name" required maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={t("web.providers.namePlaceholder")} />
              </FormField>
              <FormField label={t("web.providers.modelId")} htmlFor="provider-model">
                <Input id="provider-model" required maxLength={120} value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} placeholder={t("web.providers.modelPlaceholder")} />
              </FormField>
              <div className="md:col-span-2">
                <FormField label={t("web.providers.baseUrl")} htmlFor="provider-url">
                  <Input id="provider-url" type="url" required maxLength={300} value={draft.baseUrl} onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })} placeholder="https://api.example.com/v1" />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label={draft.id ? t("web.providers.newApiKey") : t("web.providers.apiKey")} htmlFor="provider-key">
                  <Input id="provider-key" type="password" autoComplete="new-password" required={!draft.id} maxLength={4096} value={draft.apiKey} onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })} placeholder={draft.id ? t("web.providers.keepKey") : t("web.providers.yourKey")} />
                </FormField>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <Checkbox checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
                {t("web.providers.enable")}
              </label>
            </SectionGrid>
            <div className="mt-6 flex justify-end">
              <Button disabled={saving}>{draft.id ? <Save size={16} /> : <Plus size={16} />}{providerButtonLabel}</Button>
            </div>
          </form>

          <p className="text-xs leading-5 text-muted">
            {t("web.providers.securityGuidance")}
          </p>
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
