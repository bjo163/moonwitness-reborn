"use client";

import {
  MoonClientError,
  moonClient,
  type AddonCategory,
  type AuthUserDto as AuthUser,
  type ModelFieldDto as ModelField,
  type ModelMetadataDto as ModelMetadata,
  type ModelRecordDto as ModelRecord,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  CenteredAuth,
  DataTable,
  FormField,
  Input,
  ListOption,
  LoadingScreen,
  NavSectionLabel,
  OptionNav,
  PageHeader,
  Select,
  SidePanel,
  Textarea,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import {
  ArrowLeft,
  Boxes,
  KeyRound,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { apiErrorMessage } from "../locale/api-error-message";
import { translateMetadata } from "../locale/translate-metadata";
import {
  type UiMessageKey,
  useTranslationCatalog,
} from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

const CATEGORY_ORDER: readonly AddonCategory[] = [
  "knowledge",
  "research",
  "intelligence",
  "workflow",
  "integration",
  "system",
];

const CATEGORY_LABEL_KEYS: Record<AddonCategory, UiMessageKey> = {
  knowledge: "web.models.categories.knowledge",
  research: "web.models.categories.research",
  intelligence: "web.models.categories.intelligence",
  workflow: "web.models.categories.workflow",
  integration: "web.models.categories.integration",
  system: "web.models.categories.system",
};

function inferCategory(model: ModelMetadata): AddonCategory {
  if (model.category) return model.category;
  const { name } = model;
  if (name.startsWith("corpus.") || name.startsWith("source.")) {
    return "knowledge";
  }
  if (
    name.startsWith("research.") ||
    name.startsWith("witness.") ||
    name.startsWith("story.") ||
    name.startsWith("event.") ||
    name.startsWith("person.") ||
    name.startsWith("law.") ||
    name.startsWith("mizan.") ||
    name.startsWith("character.") ||
    name.startsWith("studio.")
  ) {
    return "research";
  }
  if (name.startsWith("ai.") || name.startsWith("chat.")) return "intelligence";
  if (name.startsWith("workflow.")) return "workflow";
  if (name.startsWith("integration.") || name.startsWith("cloudflare.")) {
    return "integration";
  }
  return "system";
}

function humanizeModelName(modelName: string): string {
  return modelName
    .split(/[._]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveOptionLabel(
  optionValue: string,
  field: ModelField,
  tm: (key: string, fallback: string) => string,
): string {
  const selectionKey = field.selectionKeys?.[optionValue];
  if (selectionKey) {
    const localized = translateMetadata(selectionKey, "", tm);
    if (localized) return localized;
  }
  return optionValue
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveModelLabel(
  model: ModelMetadata,
  tm: (key: string, fallback: string) => string,
): string {
  return translateMetadata(model.labelKey, humanizeModelName(model.name), tm);
}

function fieldLabel(
  name: string,
  metadataKey: string,
  _t: (key: UiMessageKey) => string,
  tm: (key: string, fallback: string) => string,
): string {
  const suffix = name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const localized =
    translateMetadata(metadataKey, "", tm) ||
    translateMetadata(`web.models.field${suffix}`, "", tm);
  if (localized) return localized;
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toInputValue(
  field: Pick<ModelField, "type">,
  value: ModelRecord[string] | undefined,
) {
  if (value === null || value === undefined) return "";
  if (field.type === "datetime") {
    const date =
      typeof value === "number" ? new Date(value) : new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
  return String(value);
}

export default function ModelWorkspace() {
  const [user, setUser] = useState<AuthUser | null>(null);
  useLocalePreference(user);
  const { t, tm } = useTranslationCatalog();
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [modelName, setModelName] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [isPublicExplorer, setIsPublicExplorer] = useState(false);
  const [records, setRecords] = useState<ModelRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ModelRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const selectedModel = models.find((model) => model.name === modelName);
  const modelLabel = selectedModel
    ? resolveModelLabel(selectedModel, tm)
    : t("web.models.addonModels");
  const modelDescription = selectedModel
    ? translateMetadata(
        selectedModel.descriptionKey,
        selectedModel.description,
        tm,
      )
    : t("web.models.chooseModel");
  const groupedModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: t(CATEGORY_LABEL_KEYS[category]),
      items: models.filter((model) => {
        if (inferCategory(model) !== category) return false;
        if (!query) return true;
        const label = resolveModelLabel(model, tm).toLowerCase();
        return (
          label.includes(query) ||
          model.name.toLowerCase().includes(query) ||
          (model.addon?.toLowerCase().includes(query) ?? false)
        );
      }),
    })).filter((group) => group.items.length > 0);
  }, [modelSearch, models, t, tm]);
  const listView = selectedModel?.views.find((view) => view.type === "list");
  const formView = selectedModel?.views.find((view) => view.type === "form");
  const formFields = useMemo(
    () =>
      (formView?.fields ?? Object.keys(selectedModel?.fields ?? {})).filter(
        (name) =>
          selectedModel?.kind === "table" &&
          selectedModel.fields[name] &&
          !selectedModel.fields[name].computed,
      ),
    [formView, selectedModel],
  );
  const listFields = useMemo(
    () =>
      (listView?.fields ?? formFields).filter(
        (name) => selectedModel?.fields[name],
      ),
    [formFields, listView, selectedModel],
  );
  const detailFields = useMemo(
    () =>
      formFields.length > 0
        ? formFields
        : listFields,
    [formFields, listFields],
  );
  const filteredRecords = useMemo(() => {
    const query = recordSearch.trim().toLowerCase();
    if (!query) return records;
    return records.filter((row) =>
      listFields.some((fieldName) => {
        const val = row[fieldName];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(query);
      }),
    );
  }, [listFields, recordSearch, records]);

  const loadRecords = useCallback(async (model: ModelMetadata) => {
    const result =
      model.kind === "computed"
        ? await moonClient.computeModel(model.name)
        : await moonClient.listRecords(model.name);
    setRecords(result.records);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const requested =
        new URLSearchParams(window.location.search).get("model") ?? "";
      try {
        const [session, metadata] = await Promise.all([
          moonClient.currentUser(),
          moonClient.listModels(),
        ]);
        if (cancelled) return;
        setUser(session.user);
        setIsPublicExplorer(false);
        setModels(metadata.models);
        const initialModel =
          requested && metadata.models.some((item) => item.name === requested)
            ? requested
            : (metadata.models[0]?.name ?? "");
        setModelName(initialModel);
      } catch (requestError) {
        if (cancelled) return;
        if (
          requestError instanceof MoonClientError &&
          requestError.status === 401
        ) {
          try {
            const explorer = await moonClient.publicModelExplorer(
              requested || undefined,
            );
            if (cancelled) return;
            if (explorer.models.length > 0 && explorer.model) {
              setIsPublicExplorer(true);
              setModels(explorer.models);
              setModelName(explorer.model.name);
              setRecords(explorer.records);
            }
          } catch {
            // Keep unauthenticated sign-in state when requested model is not public.
          }
        } else {
          setError(apiErrorMessage(requestError, t));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    const model = models.find((item) => item.name === modelName);
    if (!model) return;
    if (!user && !isPublicExplorer) return;
    const activeModel = model;
    let cancelled = false;
    async function refresh() {
      try {
        if (!user && isPublicExplorer) {
          const explorer = await moonClient.publicModelExplorer(
            activeModel.name,
          );
          if (!cancelled) setRecords(explorer.records);
          return;
        }
        const result =
          activeModel.kind === "computed"
            ? await moonClient.computeModel(activeModel.name)
            : await moonClient.listRecords(activeModel.name);
        if (!cancelled) setRecords(result.records);
      } catch (requestError) {
        if (!cancelled) {
          setError(apiErrorMessage(requestError, t));
        }
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [isPublicExplorer, modelName, models, t, user]);

  function openForm(record?: ModelRecord) {
    setFormOpen(true);
    setSelectedRecord(record ?? null);
    setFormValues(
      Object.fromEntries(
        detailFields.map((name) => {
          const field = selectedModel?.fields[name];
          const value = record?.[name];
          return [
            name,
            field?.type === "boolean"
              ? value === true
              : toInputValue(field ?? { type: "char" }, value),
          ];
        }),
      ),
    );
    setError(null);
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedModel) return;
    setSaving(true);
    setError(null);
    const values: Record<string, string | number | boolean | null> = {};
    for (const name of formFields) {
      const field = selectedModel.fields[name];
      const value = formValues[name];
      if (field.type === "boolean") {
        values[name] = value === true;
      } else if (value === "" || value === undefined) {
        values[name] = null;
      } else if (field.type === "integer") {
        values[name] = Number(value);
      } else if (field.type === "datetime") {
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) {
          setError(
            t("web.models.invalidDate", {
              name: fieldLabel(name, field.labelKey, t, tm),
            }),
          );
          setSaving(false);
          return;
        }
        values[name] = date.toISOString();
      } else {
        values[name] = String(value);
      }
    }

    try {
      const recordId = selectedRecord?.id;
      if (recordId !== undefined) {
        await moonClient.updateRecord(
          selectedModel.name,
          String(recordId),
          values,
        );
      } else {
        await moonClient.createRecord(selectedModel.name, values);
      }
      await loadRecords(selectedModel);
      setSelectedRecord(null);
      setFormOpen(false);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(record: ModelRecord) {
    if (!selectedModel || typeof record.id !== "string") return;
    if (
      !window.confirm(
        t("web.models.deleteRecord", {
          name: String(record.name ?? record.id),
        }),
      )
    ) return;
    setError(null);
    try {
      await moonClient.deleteRecord(
        selectedModel.name,
        String(record.id),
      );
      await loadRecords(selectedModel);
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
        setFormOpen(false);
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    }
  }

  async function logout() {
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    }
  }

  if (loading) {
    return <LoadingScreen label={t("web.models.loading")} />;
  }

  if (!user && !isPublicExplorer) {
    return (
      <CenteredAuth>
        <div className="mb-5 flex items-center gap-3">
          <Boxes className="text-acid" />
          <h1 className="text-lg font-semibold">{t("web.models.title")}</h1>
        </div>
        <p className="text-sm leading-6 text-muted">
          {t("web.models.signIn")}
        </p>
        {error && <Alert variant="error" className="mt-4">{error}</Alert>}
        <Button className="mt-5 w-full" onClick={() => (window.location.href = "/auth")}>
          <ArrowLeft size={16} />
          {t("web.models.back")}
        </Button>
      </CenteredAuth>
    );
  }

  const readOnlyForm = !selectedModel?.permissions.write;

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={t("web.common.closeMenu")}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<Boxes aria-hidden="true" size={18} />}
          className="flex-none"
          closeLabel={t("web.common.closeMenu")}
          identity={
            user
              ? { name: user.name, subtitle: user.email }
              : undefined
          }
          items={
            user
              ? [
                  {
                    href: "/command-center",
                    label: t("web.models.aiWorkspace"),
                    icon: <ArrowLeft aria-hidden="true" size={16} />,
                    onSelect: () => setSidebarOpen(false),
                  },
                  {
                    href: "/providers",
                    label: t("web.models.providers"),
                    icon: <KeyRound aria-hidden="true" size={16} />,
                    onSelect: () => setSidebarOpen(false),
                  },
                ]
              : [
                  {
                    href: "/",
                    label: "A-L-L-A-H.com",
                    icon: <ArrowLeft aria-hidden="true" size={16} />,
                    onSelect: () => setSidebarOpen(false),
                  },
                  {
                    href: "/auth",
                    label: t("web.models.signInToManage"),
                    icon: <KeyRound aria-hidden="true" size={16} />,
                    onSelect: () => setSidebarOpen(false),
                  },
                ]
          }
          logout={
            user
              ? { label: t("web.common.logout"), onLogout: () => void logout() }
              : undefined
          }
          navLabel={t("web.models.title")}
          onCloseSidebar={() => setSidebarOpen(false)}
        >
          <div className="px-2 pt-2">
            <Input
              aria-label={t("web.models.searchModels")}
              placeholder={t("web.models.searchModels")}
              value={modelSearch}
              onChange={(event) => setModelSearch(event.target.value)}
            />
          </div>
          <OptionNav label={t("web.models.addonModels")}>
            {groupedModels.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">
                {t("web.models.noMatchingModels")}
              </p>
            ) : (
              groupedModels.map((group) => (
                <div key={group.category}>
                  <NavSectionLabel>{group.label}</NavSectionLabel>
                  {group.items.map((model) => (
                    <ListOption
                      key={model.name}
                      onSelect={() => {
                        setModelName(model.name);
                        setRecordSearch("");
                        setSelectedRecord(null);
                        setFormOpen(false);
                        setSidebarOpen(false);
                        setError(null);
                      }}
                      selected={modelName === model.name}
                      variant="nav"
                    >
                      <Boxes aria-hidden="true" size={15} />
                      <span className="truncate">
                        {codeMode ? model.name : resolveModelLabel(model, tm)}
                      </span>
                    </ListOption>
                  ))}
                </div>
              ))
            )}
          </OptionNav>
        </WorkspaceSidebar>
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <SidebarTrigger
              label={t("web.common.openMenu")}
              onOpenSidebar={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
            <div>
              <div className="text-sm font-semibold">{t("web.models.title")}</div>
              <div className="text-xs text-muted">{t("web.models.dataViews")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => (window.location.href = "/auth")}
              >
                {t("web.models.signInToManage")}
              </Button>
            )}
            <Button
              size="sm"
              variant={codeMode ? "secondary" : "ghost"}
              onClick={() => setCodeMode((current) => !current)}
            >
              {codeMode ? t("web.models.humanMode") : t("web.models.codeMode")}
            </Button>
            <Badge variant="outline">
              {selectedModel
                ? selectedModel.addon
                  ? `${selectedModel.addon} · ${selectedModel.name}`
                  : selectedModel.name
                : t("web.models.noModel")}
            </Badge>
          </div>
        </>
      }
    >
      <div className="ql-page-body">
        <PageHeader
          actions={
            selectedModel?.permissions.create ? (
              <Button onClick={() => openForm()}>
                <Plus size={16} />
                {t("web.models.addRecord")}
              </Button>
            ) : undefined
          }
          description={modelDescription}
          eyebrow={t("web.models.section")}
          title={modelLabel}
        />

        {!user && (
          <Alert className="mb-4">{t("web.models.publicExplorerNotice")}</Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {!selectedModel ? (
          <Card className="mt-5">
            <CardContent>
              {t("web.models.emptyModels")}
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-5">
            <CardContent className="ql-card--flush">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                <Input
                  aria-label={t("web.models.searchRecords")}
                  className="max-w-xs"
                  placeholder={t("web.models.searchRecords")}
                  value={recordSearch}
                  onChange={(event) => setRecordSearch(event.target.value)}
                />
                <Badge variant="outline">
                  {filteredRecords.length} / {records.length}
                </Badge>
              </div>
              <DataTable
                columns={listFields.map((name) => ({
                  key: name,
                  label: fieldLabel(
                    name,
                    selectedModel.fields[name]?.labelKey ?? "",
                    t,
                    tm,
                  ),
                }))}
                rows={filteredRecords}
                rowKey="id"
                actionsLabel={t("web.common.actions")}
                yesLabel={t("web.common.yes")}
                noLabel={t("web.common.no")}
                onRowClick={(record) => openForm(record)}
                emptyMessage={t("web.models.emptyRecords")}
                renderActions={
                  selectedModel.permissions.unlink
                    ? (record) => (
                        <Button
                          variant="danger"
                          size="icon"
                          aria-label={t("web.models.deleteRecord", {
                            name: String(record.name ?? "record"),
                          })}
                          onClick={() => void deleteRecord(record)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      )
                    : undefined
                }
              />
            </CardContent>
          </Card>
        )}

        {formOpen && (
          <SidePanel
            closeLabel={t("web.models.closeForm")}
            eyebrow={
              readOnlyForm
                ? t("web.models.viewRecord")
                : selectedRecord
                  ? t("web.models.editRecord")
                  : t("web.models.newRecord")
            }
            label={t("web.models.formRecord")}
            onClose={() => {
              setSelectedRecord(null);
              setFormOpen(false);
              setFormValues({});
            }}
            title={
              selectedRecord
                ? String(
                    selectedRecord.name ??
                      selectedRecord.title ??
                      selectedRecord.term ??
                      selectedRecord.witness_name ??
                      selectedRecord.canonical_id ??
                      t("web.models.editData"),
                  )
                : t("web.models.addData")
            }
          >
            <form className="ql-side-panel__form" onSubmit={(event) => void saveRecord(event)}>
              {detailFields.map((name) => {
                const field = selectedModel?.fields[name];
                if (!field) return null;
                const id = `model-field-${name}`;
                const disabled = readOnlyForm || Boolean(field.readOnly);
                if (field.type === "boolean") {
                  return (
                    <label className="ql-inline-label" key={name} htmlFor={id}>
                      <Checkbox
                        id={id}
                        disabled={disabled}
                        checked={formValues[name] === true}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [name]: event.target.checked,
                          }))
                        }
                      />
                      {fieldLabel(
                        name,
                        field.labelKey ?? "",
                        t,
                        tm,
                      )}
                    </label>
                  );
                }
                const value = String(formValues[name] ?? "");
                const optionValues =
                  field.options && field.options.length > 0
                    ? field.options
                    : field.selectionKeys
                      ? Object.keys(field.selectionKeys)
                      : undefined;
                const props = {
                  id,
                  disabled,
                  required: field.required,
                  maxLength: field.maxLength,
                  value,
                  onChange: (
                    event: React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                    >,
                  ) =>
                    setFormValues((current) => ({
                      ...current,
                      [name]: event.target.value,
                    })),
                };

                let inputType: string;
                if (field.type === "integer") {
                  inputType = "number";
                } else if (field.type === "datetime") {
                  inputType = "datetime-local";
                } else if (name === "email") {
                  inputType = "email";
                } else {
                  inputType = "text";
                }

                return (
                  <FormField
                    key={name}
                    label={fieldLabel(
                      name,
                      field.labelKey ?? "",
                      t,
                      tm,
                    )}
                    htmlFor={id}
                  >
                    {optionValues ? (
                      <Select
                        id={id}
                        disabled={disabled}
                        required={field.required}
                        value={value}
                        onChange={props.onChange}
                      >
                        {(!field.required || value === "") && (
                          <option value="">--</option>
                        )}
                        {optionValues.map((optionValue) => (
                          <option key={optionValue} value={optionValue}>
                            {resolveOptionLabel(optionValue, field, tm)}
                          </option>
                        ))}
                      </Select>
                    ) : field.type === "text" ? (
                      <Textarea {...props} rows={3} />
                    ) : (
                      <Input
                        {...props}
                        type={inputType}
                        step={field.type === "integer" ? 1 : undefined}
                      />
                    )}
                  </FormField>
                );
              })}
              {error && <Alert variant="error">{error}</Alert>}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedRecord(null);
                    setFormOpen(false);
                    setFormValues({});
                  }}
                >
                  {readOnlyForm ? t("web.models.closeForm") : t("web.models.cancel")}
                </Button>
                {!readOnlyForm && (
                  <Button type="submit" disabled={saving}>
                    <Save size={15} />
                    {saving ? t("web.models.saving") : t("web.models.save")}
                  </Button>
                )}
              </div>
            </form>
          </SidePanel>
        )}
      </div>
    </WorkspaceTemplate>
  );
}
