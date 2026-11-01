import { uiCatalogs, type UiMessageKey } from "ql_i18n/catalogs";
import { useMemo } from "react";
import { useTranslationCatalog } from "./translation-catalog";

export interface AppMessages {
  common: {
    dashboard: string;
    chat: string;
    models: string;
    providers: string;
    integrations: string;
    users: string;
    account: string;
    logout: string;
    loading: string;
    closeMenu: string;
    openMenu: string;
    localeLabel: string;
    mainNavigation: string;
    error: string;
    actions: string;
    yes: string;
    no: string;
    statusAvailable: string;
    statusProposed: string;
  };
  auth: {
    setupTitle: string;
    setupDescription: string;
    setupAction: string;
    setupSecurityNote: string;
    loginTitle: string;
    registerTitle: string;
    loginDescription: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    passwordMinimum: string;
    busy: string;
    registerAction: string;
    loginAction: string;
    existingAccount: string;
    newAccount: string;
    registerLink: string;
    loginLink: string;
    localeSaveError: string;
  };
  landing: {
    title: string;
    description: string;
    ecosystemRelation: string;
    ecosystemContextTitle: string;
    ecosystemContext: string;
    ecosystemLinkLabel: string;
    primaryAction: string;
    signedInAction: string;
    login: string;
    currentFoundation: string;
    currentFoundationDescription: string;
    foundationChat: string;
    foundationModels: string;
    foundationProviders: string;
    foundationConnectors: string;
    productDirection: string;
    journey: string[];
    journeyNote: string;
    footer: string;
    localeSaveError: string;
    progressTitle: string;
    progressDescription: string;
    progressLoading: string;
    progressError: string;
    progressDone: string;
    progressReady: string;
    progressBlocked: string;
    progressNote: string;
  };
  dashboard: {
    greeting: string;
    description: string;
    continueChat: string;
    availableTitle: string;
    availableDescription: string;
    chatDescription: string;
    modelsDescription: string;
    providersDescription: string;
    integrationsDescription: string;
    directionTitle: string;
    directionDescription: string;
    directionNote: string;
    logoutError: string;
    trackerTitle: string;
    trackerDescription: string;
    trackerLoading: string;
    trackerError: string;
    trackerReadyTitle: string;
    trackerEmptyReady: string;
    trackerAllTitle: string;
    trackerStateLabels: {
      done: string;
      in_progress: string;
      proposed: string;
      blocked: string;
      pending: string;
    };
    trackerAcceptance: string;
    trackerDependencies: string;
    trackerOwner: string;
    trackerCompletedAt: string;
    trackerHistoryNote: string;
  };
  assistant: {
    newConversation: string;
    history: string;
    emptyHistory: string;
    deleteConversation: string;
    deleteNamedConversation: string;
    aiAssistant: string;
    startPrompt: string;
    startDescription: string;
    startAction: string;
    inputPlaceholder: string;
    activeInputPlaceholder: string;
    sendMessage: string;
    noMessages: string;
    loadingMessages: string;
    conversationError: string;
    sendError: string;
    deleteError: string;
    logoutError: string;
    savedNotice: string;
    homeLink: string;
    activePrompt: string;
    activeDescription: string;
    thinking: string;
    newConversationPlaceholder: string;
    sendHint: string;
  };
  workflow: {
    navLabel: string;
    queueTitle: string;
    queueSubtitle: string;
    loading: string;
    empty: string;
    noReviewerActions: string;
    noSubmitterActions: string;
    errorQueue: string;
    errorTransition: string;
    transitionSaved: string;
    columnTitle: string;
    columnState: string;
    columnUrgency: string;
    columnRevision: string;
    columnUpdated: string;
    detailTitle: string;
    detailBody: string;
    detailSubject: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    auditTitle: string;
    auditEmpty: string;
    auditFrom: string;
    auditTo: string;
    auditAction: string;
    auditWhen: string;
    auditReason: string;
    stateLabels: Record<string, string>;
    actionLabels: Record<string, string>;
  };
  research: {
    navLabel: string;
    title: string;
    description: string;
    reviewerRequired: string;
    edition: string;
    loadingEditions: string;
    noEditions: string;
    loadingCandidates: string;
    emptyCandidates: string;
    candidate: string;
    normalizedForm: string;
    occurrenceCount: string;
    verseCount: string;
    reviewStatus: string;
    unreviewed: string;
    sourceVersion: string;
    algorithmVersion: string;
    normalizationVersion: string;
    evidenceReferences: string;
    referenceId: string;
    checksum: string;
    decision: string;
    rationale: string;
    rationalePlaceholder: string;
    submitReview: string;
    saving: string;
    saved: string;
    decisions: Record<string, string>;
    researchDisclaimer: string;
  };
}

function isUiMessageKey(value: string): value is UiMessageKey {
  return Object.hasOwn(uiCatalogs.id, value);
}

export function useMessages(): AppMessages {
  const { t } = useTranslationCatalog();
  return useMemo(() => {
    const createTree = (path: string[]): object =>
      new Proxy(Object.create(null) as Record<string, unknown>, {
        get(_target, property) {
          if (typeof property !== "string") return undefined;
          const nextPath = [...path, property];
          const relativeKey = nextPath.join(".");
          if (relativeKey === "landing.journey") {
            return Object.keys(uiCatalogs.id)
              .filter(isUiMessageKey)
              .filter((key) => /^web\.landing\.journey\.step_\d+$/.test(key))
              .sort((left, right) => {
                const leftOrder = Number(left.slice(left.lastIndexOf("_") + 1));
                const rightOrder = Number(right.slice(right.lastIndexOf("_") + 1));
                return leftOrder - rightOrder;
              })
              .map((key) => t(key));
          }
          const messageKey = `web.${relativeKey}`;
          if (isUiMessageKey(messageKey)) return t(messageKey);
          return createTree(nextPath);
        },
      });

    return createTree([]) as AppMessages;
  }, [t]);
}
