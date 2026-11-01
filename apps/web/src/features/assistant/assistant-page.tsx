"use client";

import {
  moonClient,
  type AuthUserDto as AuthUser,
  type ChatMessageDto as ChatMessage,
  type ConversationDto as Conversation,
} from "@moonwitness/moonclient";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Textarea,
  WorkspaceTemplate,
  cn,
} from "@moonwitness/ui";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useLocalePreference } from "../locale/use-locale-preference";
import {
  ArrowUp,
  Bot,
  Boxes,
  KeyRound,
  LogOut,
  MessageSquare,
  Menu,
  Plug,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
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
  const copy = useMessages();
  const copyRef = useRef(copy);
  copyRef.current = copy;
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
      setError(
        requestError instanceof Error
          ? requestError.message
          : copyRef.current.assistant.conversationError,
      );
    }
  }, []);

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
            requestError instanceof Error &&
            requestError.message === "Authentication required."
          ) {
            router.replace("/auth");
          } else {
            setError(
              requestError instanceof Error
                ? requestError.message
                : copyRef.current.assistant.conversationError,
            );
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
  }, [loadConversations, router]);

  async function logout() {
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : copy.assistant.logoutError,
      );
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
          setError(
            requestError instanceof Error
              ? requestError.message
              : copy.assistant.conversationError,
          );
        }
      }
    }
    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeId, copy.assistant.conversationError]);

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
      setError(
        requestError instanceof Error
          ? requestError.message
          : copy.assistant.sendError,
      );
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
      setError(
        requestError instanceof Error
          ? requestError.message
          : copy.assistant.deleteError,
      );
    }
  }

  if (loading) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center text-sm text-stone-500">
        {copy.common.loading}
      </main>
    );
  }

  if (!user) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center text-sm text-stone-500">
        {copy.common.loading}
      </main>
    );
  }

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <>
        <div className="flex h-12 items-center justify-between px-2">
          <a href="/command-center" className="ql-hud-brand flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Sparkles size={16} />
            </span>
            MoonWitness
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={copy.common.closeMenu}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        <a
          href="/command-center"
          className="ql-nav-link mt-4"
          onClick={() => setSidebarOpen(false)}
        >
          <Boxes aria-hidden="true" size={16} />
          {copy.common.dashboard}
        </a>
        <Button
          variant="secondary"
          className="mt-5 w-full justify-start gap-2.5"
          onClick={() => void createConversation()}
        >
          <Plus size={17} />
          {copy.assistant.newConversation}
        </Button>

        <a href="/models" className="ql-nav-link mt-2">
          <Boxes size={16} />
          {copy.common.models}
        </a>
        <a href="/providers" className="ql-nav-link mt-2">
          <KeyRound size={16} />
          {copy.common.providers}
        </a>
        {(user?.groups ?? []).some((group) =>
          group === "connector" || group === "operator",
        ) && (
          <a href="/connectors" className="ql-nav-link mt-2">
            <Plug size={16} />
            {copy.common.integrations}
          </a>
        )}
        {(user?.groups ?? []).includes("admin") && (
          <a href="/admin/users" className="ql-nav-link mt-2">
            <ShieldCheck size={16} />
            {copy.common.users}
          </a>
        )}

        <div className="mb-2 mt-7 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
          {copy.assistant.history}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto" aria-label={copy.assistant.history}>
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="group flex items-center gap-1"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveId(conversation.id);
                  setError(null);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  activeId === conversation.id
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-600 hover:bg-white/70 hover:text-stone-950",
                )}
              >
                <MessageSquare size={15} className="shrink-0 text-stone-400" />
                <span className="min-w-0 flex-1 truncate">
                  {conversation.title}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${copy.assistant.deleteNamedConversation} ${conversation.title}`}
                title={copy.assistant.deleteConversation}
                onClick={(event) =>
                  void deleteConversation(event, conversation.id)
                }
                className="rounded-md p-1 text-stone-400 opacity-0 hover:bg-stone-100 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {!loading && conversations.length === 0 && (
            <p className="px-3 py-2 text-xs leading-5 text-stone-500">
              {copy.assistant.emptyHistory}
            </p>
          )}
        </nav>

        <div className="mt-3 flex items-center gap-2 border-t border-stone-200 px-2 pt-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-stone-700">
              {user.name}
            </div>
            <div className="truncate text-[11px] text-stone-500">
              {user.email}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.common.logout}
            title={copy.common.logout}
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
              aria-label={copy.common.openMenu}
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </Button>
            <div className="text-sm font-medium text-stone-700">{copy.common.chat}</div>
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
                <div className="mb-5 flex size-14 items-center justify-center border border-stone-700 bg-[#151d15] shadow-[4px_4px_0_#050706]">
                  <Bot size={25} className="text-[#d7ff63]" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
                  {copy.assistant.startPrompt}
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
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
                <div className="mb-5 flex size-14 items-center justify-center border border-stone-700 bg-[#151d15] shadow-[4px_4px_0_#050706]">
                  <Sparkles size={24} className="text-stone-700" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
                  {copy.assistant.activePrompt}
                </h1>
                <p className="mt-2 text-sm text-stone-500">
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
                        : "pt-0.5 text-stone-800",
                    )}
                  >
                    {message.content}
                  </div>
                </article>
              ))}
              {sending && (
                <div className="flex items-center gap-3 text-sm text-stone-500">
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
                <span className="text-[11px] text-stone-400">
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
            <p className="mt-2 text-center text-[11px] text-stone-400">
              {copy.assistant.savedNotice}
            </p>
          </div>
        </div>
    </WorkspaceTemplate>
  );
}
