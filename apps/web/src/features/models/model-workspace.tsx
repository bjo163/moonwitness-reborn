"use client";

import {
  MoonClientError,
  moonClient,
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
  Textarea,
  WorkspaceTemplate,
  cn,
} from "@moonwitness/ui";
import {
  ArrowLeft,
  Boxes,
  KeyRound,
  LogOut,
  Menu,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { translateMetadata } from "../locale/translate-metadata";
import {
  type UiMessageKey,
  useTranslationCatalog,
} from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

function fieldLabel(
  name: string,
  metadataKey: string,
  t: (key: UiMessageKey) => string,
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
  const [records, setRecords] = useState<ModelRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ModelRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedModel = models.find((model) => model.name === modelName);
  const modelLabel = selectedModel
    ? translateMetadata(
        selectedModel.labelKey,
        fieldLabel(
        selectedModel.name.split(".").pop() ?? selectedModel.name,
        selectedModel.labelKey,
        t,
        tm,
        ),
        tm,
      )
    : t("web.models.addonModels");
  const modelDescription = selectedModel
    ? translateMetadata(
        selectedModel.descriptionKey,
        selectedModel.description,
        tm,
      )
    : t("web.models.chooseModel");
  const listView = selectedModel?.views.find((view) => view.type === "list");
  const formView = selectedModel?.views.find((view) => view.type === "form");
  const formFields = useMemo(
    () =>
      (formView?.fields ?? Object.keys(selectedModel?.fields ?? {})).filter(
        (name) => selectedModel?.fields[name],
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

  const loadRecords = useCallback(async (name: string) => {
    const result = await moonClient.listRecords(name);
    setRecords(result.records);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const [session, metadata] = await Promise.all([
          moonClient.currentUser(),
          moonClient.listModels(),
        ]);
        if (cancelled) return;
        setUser(session.user);
        setModels(metadata.models);
        setModelName(metadata.models[0]?.name ?? "");
      } catch (requestError) {
        if (!cancelled) {
          if (!(requestError instanceof MoonClientError && requestError.status === 401)) {
            setError(apiErrorMessage(requestError, t));
          }
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
    if (!user || !modelName) return;
    let cancelled = false;
    async function refresh() {
      try {
        const result = await moonClient.listRecords(modelName);
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
  }, [modelName, t, user]);

  function openForm(record?: ModelRecord) {
    setFormOpen(true);
    setSelectedRecord(record ?? null);
    setFormValues(
      Object.fromEntries(
        formFields.map((name) => {
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
      await loadRecords(selectedModel.name);
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
      await loadRecords(selectedModel.name);
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
      window.location.href = "/command-center";
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    }
  }

  if (loading) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center">
        {t("web.models.loading")}
      </main>
    );
  }

  if (!user) {
    return (
      <CenteredAuth>
        <div className="mb-5 flex items-center gap-3">
          <Boxes className="text-[#d7ff63]" />
          <h1 className="text-lg font-semibold">{t("web.models.title")}</h1>
        </div>
        <p className="text-sm leading-6 text-stone-400">
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

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={t("web.common.closeMenu")}
      sidebar={
        <>
          <div className="flex h-12 items-center justify-between px-2">
            <a href="/command-center" className="ql-hud-brand flex items-center gap-2.5 font-semibold">
              <Boxes size={18} className="text-[#d7ff63]" />
              MoonWitness
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={t("web.common.closeMenu")}
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <a href="/command-center" className="ql-nav-link mt-4">
            <ArrowLeft size={16} />
            {t("web.models.aiWorkspace")}
          </a>
          <a href="/providers" className="ql-nav-link mt-2">
            <KeyRound size={16} />
            {t("web.models.providers")}
          </a>
          <div className="ql-nav-section">{t("web.models.addonModels")}</div>
          <nav className="flex-1 space-y-1" aria-label={t("web.models.addonModels")}>
            {models.map((model) => (
              <Button
                key={model.name}
                variant="ghost"
                size="sm"
                className={cn(
                  "ql-nav-link w-full justify-start",
                  modelName === model.name && "is-active",
                )}
                onClick={() => {
                  setModelName(model.name);
                  setSelectedRecord(null);
                  setFormOpen(false);
                  setSidebarOpen(false);
                  setError(null);
                }}
              >
                <Boxes size={15} />
                {model.name}
              </Button>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-stone-700 px-2 pt-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{user.name}</div>
              <div className="truncate text-[11px] text-stone-500">{user.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("web.common.logout")}
              onClick={() => void logout()}
            >
              <LogOut size={16} />
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
              aria-label={t("web.common.openMenu")}
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div>
              <div className="text-sm font-semibold">{t("web.models.title")}</div>
              <div className="text-xs text-stone-500">{t("web.models.dataViews")}</div>
            </div>
          </div>
          <Badge variant="outline">{selectedModel?.name ?? t("web.models.noModel")}</Badge>
        </>
      }
    >
      <div className="ql-model-workspace">
        <div className="ql-model-heading">
          <div>
            <div className="ql-eyebrow">{t("web.models.section")}</div>
            <h1>{modelLabel}</h1>
            <p>{modelDescription}</p>
          </div>
          {selectedModel?.permissions.create && (
            <Button onClick={() => openForm()}>
              <Plus size={16} />
              {t("web.models.addRecord")}
            </Button>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {!selectedModel ? (
          <Card className="mt-5">
            <CardContent>
              {t("web.models.emptyModels")}
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-5">
            <CardContent className="ql-model-table-content">
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
                rows={records}
                rowKey="id"
                actionsLabel={t("web.common.actions")}
                yesLabel={t("web.common.yes")}
                noLabel={t("web.common.no")}
                onRowClick={
                  selectedModel.permissions.write
                    ? (record) => openForm(record)
                    : undefined
                }
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
          <section className="ql-model-editor" aria-label={t("web.models.formRecord")}>
            <div className="ql-model-editor__header">
              <div>
                <div className="ql-eyebrow">{selectedRecord ? t("web.models.editRecord") : t("web.models.newRecord")}</div>
                <h2>{selectedRecord ? String(selectedRecord.name ?? t("web.models.editData")) : t("web.models.addData")}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("web.models.closeForm")}
                onClick={() => {
                  setSelectedRecord(null);
                  setFormOpen(false);
                  setFormValues({});
                }}
              >
                <X size={18} />
              </Button>
            </div>
            <form className="ql-model-editor__form" onSubmit={(event) => void saveRecord(event)}>
              {formFields.map((name) => {
                const field = selectedModel?.fields[name];
                if (!field) return null;
                const id = `model-field-${name}`;
                if (field.type === "boolean") {
                  return (
                    <label className="ql-model-checkbox" key={name} htmlFor={id}>
                      <Checkbox
                        id={id}
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
                const props = {
                  id,
                  required: field.required,
                  maxLength: field.maxLength,
                  value,
                  onChange: (
                    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
                    {field.type === "text" ? (
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
                  {t("web.models.cancel")}
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save size={15} />
                  {saving ? t("web.models.saving") : t("web.models.save")}
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>
    </WorkspaceTemplate>
  );
}
