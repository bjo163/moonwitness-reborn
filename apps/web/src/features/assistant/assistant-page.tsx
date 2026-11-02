"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto as AuthUser,
  type ChatMessageDto as ChatMessage,
  type ConversationDto as Conversation,
} from "@moonwitness/moonclient";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  LoadingScreen,
  ListOption,
  NavSectionLabel,
  OptionNav,
  Textarea,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
  cn,
} from "@moonwitness/ui";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";
import { apiErrorMessage } from "../locale/api-error-message";
import {
  ArrowUp,
  Bot,
  Boxes,
  KeyRound,
  LogOut,
  MessageSquare,
  Plug,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locale, changeLocale, saving, error: localeError } =
    useLocalePreference(user);
  const { t } = useTranslationCatalog();
  const copy = useMessages();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const result = await moonClient.listConversations();
    setConversations(result.conversations);
    return result.conversations;
  }, []);

  const createConversation = useCallback(async () => {
    setError(null);
    try {
      const result = await moonClient.createConversation();
      setConversations((current) => [result.conversation, ...current]);
      setActiveId(result.conversation.id);
      setMessages([]);
      setSidebarOpen(false);
      textareaRef.current?.focus();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const session = await moonClient.currentUser();
        if (cancelled) return;
        setUser(session.user);
        const existing = await loadConversations();
        if (cancelled) return;
        if (existing.length > 0) {
          setActiveId(existing[0].id);
        }
      } catch (requestError) {
        if (!cancelled) {
          if (
            requestError instanceof MoonClientError &&
            requestError.status === 401
          ) {
            router.replace("/auth");
          } else {
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
  }, [loadConversations, router, t]);

  async function logout() {
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    }
  }

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    const conversationId = activeId;
    let cancelled = false;
    async function loadMessages() {
      try {
        const result = await moonClient.listMessages(conversationId);
        if (!cancelled) setMessages(result.messages);
      } catch (requestError) {
        if (!cancelled) {
          setError(apiErrorMessage(requestError, t));
        }
      }
    }
    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeId, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const content = input.trim();
    if (!content || !activeId || sending) return;

    setInput("");
    setError(null);
    setSending(true);
    try {
      const result = await moonClient.sendChat({
        conversationId: activeId,
        input: content,
      });
      const timestamp = new Date().toISOString();
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user", content, createdAt: timestamp },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply,
          createdAt: timestamp,
        },
      ]);
      await loadConversations();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
      try {
        const result = await moonClient.listMessages(activeId);
        setMessages(result.messages);
      } catch {
        // Keep the original request error visible.
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function deleteConversation(
    event: React.MouseEvent<HTMLButtonElement>,
    conversationId: string,
  ) {
    event.stopPropagation();
    try {
      await moonClient.deleteConversation(conversationId);
      const remaining = await loadConversations();
      if (activeId === conversationId) {
        setActiveId(remaining[0]?.id ?? null);
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    }
  }

  if (loading) {
    return <LoadingScreen label={copy.common.loading} />;
  }

  if (!user) {
    return <LoadingScreen label={copy.common.loading} />;
  }

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<Sparkles aria-hidden="true" size={16} />}
          closeLabel={copy.common.closeMenu}
          identity={{ name: user.name, subtitle: user.email }}
          items={[
            {
              href: "/command-center",
              label: copy.common.dashboard,
              icon: <Boxes aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/models",
              label: copy.common.models,
              icon: <Boxes aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/providers",
              label: copy.common.providers,
              icon: <KeyRound aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            ...((user.groups ?? []).some(
              (group) => group === "connector" || group === "operator",
            )
              ? [
                  {
                    href: "/connectors",
                    label: copy.common.integrations,
                    icon: <Plug aria-hidden="true" size={16} />,
                    onSelect: () => setSidebarOpen(false),
                  },
                ]
              : []),
            ...((user.groups ?? []).includes("admin")
              ? [
                  {
                    href: "/admin/users",
                    label: copy.common.users,
                    icon: <ShieldCheck aria-hidden="true" size={16} />,
                    onSelect: () => setSidebarOpen(false),
                  },
                ]
              : []),
          ]}
          logout={{
            label: copy.common.logout,
            onLogout: () => void logout(),
            icon: <LogOut aria-hidden="true" size={16} />,
          }}
          navLabel={copy.common.mainNavigation}
          onCloseSidebar={() => setSidebarOpen(false)}
          className="flex-none"
        >
          <Button
            variant="secondary"
            className="mt-5 w-full justify-start gap-2.5"
            onClick={() => void createConversation()}
          >
            <Plus aria-hidden="true" size={17} />
            {copy.assistant.newConversation}
          </Button>
          <NavSectionLabel className="mb-2 mt-7">
            {copy.assistant.history}
          </NavSectionLabel>
          <OptionNav label={copy.assistant.history}>
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="group flex items-center gap-1"
            >
              <ListOption
                selected={activeId === conversation.id}
                variant="nav"
                className="min-w-0 flex-1"
                onSelect={() => {
                  setActiveId(conversation.id);
                  setError(null);
                  setSidebarOpen(false);
                }}
              >
                <MessageSquare size={15} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate">
                  {conversation.title}
                </span>
              </ListOption>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${copy.assistant.deleteNamedConversation} ${conversation.title}`}
                title={copy.assistant.deleteConversation}
                onClick={(event) =>
                  void deleteConversation(event, conversation.id)
                }
                className="rounded-md p-1 text-muted opacity-0 hover:bg-panel-edge hover:text-danger group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {!loading && conversations.length === 0 && (
            <p className="px-3 py-2 text-xs leading-5 text-muted">
              {copy.assistant.emptyHistory}
            </p>
          )}
          </OptionNav>
        </WorkspaceSidebar>
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <SidebarTrigger
              label={copy.common.openMenu}
              onOpenSidebar={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
            <div className="text-sm font-medium text-ink-soft">{copy.common.chat}</div>
          </div>
          <Badge variant="live" className="ql-hud-status">
            {copy.assistant.aiAssistant}
          </Badge>
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            onChange={(nextLocale) => void changeLocale(nextLocale)}
            disabled={saving}
          />
        </>
      }
    >

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="ql-hud-thread mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-8 md:px-8">
            {!activeId && !loading && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-5 flex size-14 items-center justify-center border border-hairline bg-panel-edge shadow-hud-sm">
                  <Bot size={25} className="text-acid" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
                  {copy.assistant.startPrompt}
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  {copy.assistant.startDescription}
                </p>
                <Button className="mt-6" onClick={() => void createConversation()}>
                  <Plus size={16} />
                  {copy.assistant.startAction}
                </Button>
              </div>
            )}

            {activeId && messages.length === 0 && !loading && (
              <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
                <div className="mb-5 flex size-14 items-center justify-center border border-hairline bg-panel-edge shadow-hud-sm">
                  <Sparkles size={24} className="text-ink-soft" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
                  {copy.assistant.activePrompt}
                </h1>
                <p className="mt-2 text-sm text-muted">
                  {copy.assistant.activeDescription}
                </p>
              </div>
            )}

            <div className="space-y-7">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "justify-end",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="ql-hud-assistant-mark mt-0.5 flex size-8 shrink-0 items-center justify-center">
                      <Sparkles size={15} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap text-[15px] leading-7",
                      message.role === "user"
                        ? "ql-hud-user-message px-4 py-2.5"
                        : "pt-0.5 text-ink",
                    )}
                  >
                    {message.content}
                  </div>
                </article>
              ))}
              {sending && (
                <div className="flex items-center gap-3 text-sm text-muted">
                  <div className="ql-hud-assistant-mark flex size-8 items-center justify-center">
                    <Sparkles size={15} />
                  </div>
                  <span className="animate-pulse">{copy.assistant.thinking}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        <div className="w-full px-4 pb-5 pt-2 md:px-8">
          <div className="mx-auto max-w-3xl">
            {(error || localeError) && (
              <Alert variant="error" className="mb-3">
                {error ?? localeError}
              </Alert>
            )}
            <form
              onSubmit={(event) => void sendMessage(event)}
              className="ql-hud-composer px-4 pb-3 pt-1"
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeId
                    ? copy.assistant.activeInputPlaceholder
                    : copy.assistant.newConversationPlaceholder
                }
                aria-label={copy.assistant.inputPlaceholder}
                maxLength={16_000}
                disabled={!activeId || sending}
                rows={2}
                className="max-h-40 min-h-12"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">
                  {copy.assistant.sendHint}
                </span>
                <Button
                  type="submit"
                  size="icon"
                  aria-label={copy.assistant.sendMessage}
                  disabled={!input.trim() || !activeId || sending}
                  className="size-8 rounded-full"
                >
                  <ArrowUp size={17} />
                </Button>
              </div>
            </form>
            <p className="mt-2 text-center text-[11px] text-muted">
              {copy.assistant.savedNotice}
            </p>
          </div>
        </div>
    </WorkspaceTemplate>
  );
}
