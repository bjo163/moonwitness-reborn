import type { QlOrm, QlRecord } from "ql_orm";
import type { UiLocale } from "@moonwitness/types";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  active: boolean;
  role: string;
  preferredLocale: UiLocale;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Verification {
  id: string;
  userId: string;
  purpose: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageGroundingStatus =
  | "grounded"
  | "insufficient_evidence"
  | "legacy";

export interface CitationReference {
  evidenceId: string;
  editionId: string;
  editionKey: string;
  surah: number;
  ayah: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  groundingStatus?: MessageGroundingStatus;
  citations: CitationReference[];
}

export interface MessageGroundingInput {
  groundingStatus: MessageGroundingStatus;
  citations?: readonly CitationReference[];
}

const MAX_CITATIONS_PER_MESSAGE = 100;

export type PublicUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "preferredLocale"
>;

export interface ConversationStore {
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
    initialSetupOwner?: boolean;
    preferredLocale?: UiLocale;
  }): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUserPreferredLocale(
    id: string,
    preferredLocale: UiLocale,
  ): Promise<User | undefined>;
  createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  getSessionUser(tokenHash: string, now?: Date): Promise<User | undefined>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteSessionsForUser(userId: string): Promise<void>;
  createVerification(input: {
    userId: string;
    purpose: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<Verification>;
  findLatestVerification(
    userId: string,
    purpose: string,
  ): Promise<Verification | undefined>;
  findVerification(purpose: string, tokenHash: string): Promise<Verification | undefined>;
  /**
   * Single-use claim: the row is removed by its unique token hash, so exactly
   * one concurrent caller can observe `true`.
   */
  claimVerification(tokenHash: string): Promise<boolean>;
  deleteVerifications(userId: string, purpose: string): Promise<void>;
  setPasswordHash(userId: string, passwordHash: string): Promise<boolean>;
  createConversation(userId: string, title?: string): Promise<Conversation>;
  listConversations(userId: string): Promise<Conversation[]>;
  getConversation(
    id: string,
    userId: string,
  ): Promise<Conversation | undefined>;
  getMessages(
    conversationId: string,
    userId: string,
    limit?: number,
  ): Promise<Message[]>;
  addMessage(
    conversationId: string,
    userId: string,
    role: "user" | "assistant",
    content: string,
    grounding?: MessageGroundingInput,
  ): Promise<Message>;
  deleteConversation(id: string, userId: string): Promise<boolean>;
  close(): void;
}

function requiredString(record: QlRecord, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Stored record field '${key}' must be a string.`);
  }
  return value;
}

function requiredBoolean(record: QlRecord, key: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`Stored record field '${key}' must be a boolean.`);
  }
  return value;
}

function requiredDate(record: QlRecord, key: string): Date {
  const value = record[key];
  let date: Date | undefined;
  if (typeof value === "number") {
    date = new Date(value);
  } else if (typeof value === "string") {
    date = new Date(value);
  } else {
    date = undefined;
  }
  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`Stored record field '${key}' must be a valid datetime.`);
  }
  return date;
}

const LEAST_PRIVILEGE_ROLE = "member";

function optionalRole(record: QlRecord): string {
  const value = record.role;
  // A missing role must never widen access, so fall back to the lowest privilege.
  return typeof value === "string" && value.trim() ? value : LEAST_PRIVILEGE_ROLE;
}

function requiredLocale(record: QlRecord): UiLocale {
  const value = requiredString(record, "preferred_locale");
  if (value !== "id" && value !== "en") {
    throw new Error("Stored user preferred_locale is invalid.");
  }
  return value;
}

function userFromRecord(record: QlRecord): User {
  return {
    id: requiredString(record, "id"),
    name: requiredString(record, "name"),
    email: requiredString(record, "email"),
    passwordHash: requiredString(record, "password_hash"),
    active: requiredBoolean(record, "active"),
    role: optionalRole(record),
    preferredLocale: requiredLocale(record),
    createdAt: requiredDate(record, "created_at"),
  };
}

function verificationFromRecord(record: QlRecord): Verification {
  return {
    id: requiredString(record, "id"),
    userId: requiredString(record, "user_id"),
    purpose: requiredString(record, "purpose"),
    tokenHash: requiredString(record, "token_hash"),
    expiresAt: requiredDate(record, "expires_at"),
    createdAt: requiredDate(record, "created_at"),
  };
}

function conversationFromRecord(record: QlRecord): Conversation {
  return {
    id: requiredString(record, "id"),
    userId: requiredString(record, "user_id"),
    title: requiredString(record, "title"),
    createdAt: requiredDate(record, "created_at"),
    updatedAt: requiredDate(record, "updated_at"),
  };
}

function messageFromRecord(record: QlRecord): Message {
  const role = requiredString(record, "role");
  if (role !== "user" && role !== "assistant") {
    throw new Error("Stored message role is invalid.");
  }
  const storedGroundingStatus = record.grounding_status;
  let groundingStatus: MessageGroundingStatus | undefined;
  if (role === "assistant") {
    if (storedGroundingStatus === undefined || storedGroundingStatus === null) {
      groundingStatus = "legacy";
    } else if (
      storedGroundingStatus === "grounded" ||
      storedGroundingStatus === "insufficient_evidence" ||
      storedGroundingStatus === "legacy"
    ) {
      groundingStatus = storedGroundingStatus;
    } else {
      throw new Error("Stored message grounding status is invalid.");
    }
  } else if (storedGroundingStatus !== undefined && storedGroundingStatus !== null) {
    throw new Error("User messages cannot have a grounding status.");
  }
  return {
    id: requiredString(record, "id"),
    conversationId: requiredString(record, "conversation_id"),
    role,
    content: requiredString(record, "content"),
    createdAt: requiredDate(record, "created_at"),
    ...(groundingStatus ? { groundingStatus } : {}),
    citations: [],
  };
}

function requiredInteger(record: QlRecord, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`Stored record field '${key}' must be an integer.`);
  }
  return value;
}

function citationReferenceFromRecord(record: QlRecord): CitationReference {
  return {
    evidenceId: requiredString(record, "evidence_id"),
    editionId: requiredString(record, "edition_id"),
    editionKey: requiredString(record, "edition_key"),
    surah: requiredInteger(record, "surah"),
    ayah: requiredInteger(record, "ayah"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyBoundedString(
  value: unknown,
  maximumLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximumLength
  );
}

function isCoordinate(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= maximum
  );
}

function isCitationReference(value: unknown): value is CitationReference {
  return (
    isRecord(value) &&
    isNonEmptyBoundedString(value.evidenceId, 64) &&
    isNonEmptyBoundedString(value.editionId, 64) &&
    isNonEmptyBoundedString(value.editionKey, 160) &&
    isCoordinate(value.surah, 114) &&
    isCoordinate(value.ayah, 286)
  );
}

function isCitationReferenceArray(
  value: unknown,
): value is readonly CitationReference[] {
  return (
    Array.isArray(value) &&
    (value as unknown[]).every(isCitationReference)
  );
}

function isMessageGroundingStatus(
  value: unknown,
): value is MessageGroundingStatus {
  return (
    value === "grounded" ||
    value === "insufficient_evidence" ||
    value === "legacy"
  );
}

function validateGroundingInput(
  role: "user" | "assistant",
  grounding: MessageGroundingInput | undefined,
): {
  groundingStatus?: MessageGroundingStatus;
  citations: readonly CitationReference[];
} {
  if (role === "user" && grounding !== undefined) {
    throw new Error("User messages cannot include grounding metadata.");
  }
  const rawGroundingStatus: unknown =
    role === "assistant" ? grounding?.groundingStatus ?? "legacy" : undefined;
  if (
    rawGroundingStatus !== undefined &&
    !isMessageGroundingStatus(rawGroundingStatus)
  ) {
    throw new Error("Message grounding status is invalid.");
  }
  const groundingStatus = rawGroundingStatus;
  const rawCitations: unknown = grounding?.citations ?? [];
  if (!isCitationReferenceArray(rawCitations)) {
    throw new Error("Message citations must be valid citation references.");
  }
  const citations = rawCitations;
  if (citations.length > MAX_CITATIONS_PER_MESSAGE) {
    throw new Error(
      `A message may include at most ${MAX_CITATIONS_PER_MESSAGE} citations.`,
    );
  }
  if (groundingStatus === "grounded" && citations.length === 0) {
    throw new Error("Grounded messages must include at least one citation.");
  }
  if (groundingStatus !== "grounded" && citations.length > 0) {
    throw new Error("Only grounded messages may include citations.");
  }
  const evidenceIds = new Set<string>();
  for (const citation of citations) {
    if (evidenceIds.has(citation.evidenceId)) {
      throw new Error("Message citations must reference unique evidence IDs.");
    }
    evidenceIds.add(citation.evidenceId);
  }
  return {
    ...(groundingStatus ? { groundingStatus } : {}),
    citations,
  };
}

export function createConversationStore(orm: QlOrm): ConversationStore {
  return {
    async createUser(input) {
      return userFromRecord(
        await orm.createRecordForService("res.users", {
          name: input.name,
          email: input.email,
          password_hash: input.passwordHash,
          active: true,
          ...(input.role ? { role: input.role } : {}),
          ...(input.initialSetupOwner
            ? { setup_claim: "initial_super_admin" }
            : {}),
          ...(input.preferredLocale
            ? { preferred_locale: input.preferredLocale }
            : {}),
        }),
      );
    },

    async getUserByEmail(email) {
      const record = await orm.findOneByService("res.users", {
        email,
        active: true,
      });
      return record ? userFromRecord(record) : undefined;
    },

    async getUserById(id) {
      const record = await orm.findOneByService("res.users", {
        id,
        active: true,
      });
      return record ? userFromRecord(record) : undefined;
    },

    async updateUserPreferredLocale(id, preferredLocale) {
      const updated = await orm.updateRecordsForService(
        "res.users",
        { id },
        { preferred_locale: preferredLocale },
      );
      return updated ? this.getUserById(id) : undefined;
    },

    async createSession(userId, tokenHash, expiresAt) {
      await orm.createRecordForService("res.sessions", {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });
    },

    async getSessionUser(tokenHash, now = new Date()) {
      const session = await orm.findOneByService("res.sessions", {
        token_hash: tokenHash,
      });
      if (!session || requiredDate(session, "expires_at") <= now) {
        return undefined;
      }
      return this.getUserById(requiredString(session, "user_id"));
    },

    async deleteSession(tokenHash) {
      await orm.deleteRecordsForService("res.sessions", {
        token_hash: tokenHash,
      });
    },

    async deleteSessionsForUser(userId) {
      await orm.deleteRecordsForService("res.sessions", { user_id: userId });
    },

    async createVerification(input) {
      return verificationFromRecord(
        await orm.createRecordForService("res.verification", {
          user_id: input.userId,
          purpose: input.purpose,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
        }),
      );
    },

    async findLatestVerification(userId, purpose) {
      const record = await orm.findOneByService("res.verification", {
        user_id: userId,
        purpose,
      });
      return record ? verificationFromRecord(record) : undefined;
    },

    async findVerification(purpose, tokenHash) {
      const record = await orm.findOneByService("res.verification", {
        purpose,
        token_hash: tokenHash,
      });
      return record ? verificationFromRecord(record) : undefined;
    },

    async claimVerification(tokenHash) {
      return (
        (await orm.deleteRecordsForService("res.verification", {
          token_hash: tokenHash,
        })) === 1
      );
    },

    async deleteVerifications(userId, purpose) {
      await orm.deleteRecordsForService("res.verification", {
        user_id: userId,
        purpose,
      });
    },

    async setPasswordHash(userId, passwordHash) {
      return (
        (await orm.updateRecordsForService(
          "res.users",
          { id: userId, active: true },
          { password_hash: passwordHash },
        )) === 1
      );
    },

    async createConversation(userId, title = "Percakapan baru") {
      return conversationFromRecord(
        await orm.createRecordForService("chat.conversation", {
          user_id: userId,
          title,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      );
    },

    async listConversations(userId) {
      const records = await orm.findManyForService(
        "chat.conversation",
        userId,
        500,
      );
      return records
        .sort(
          (left, right) =>
            requiredDate(right, "updated_at").getTime() -
            requiredDate(left, "updated_at").getTime(),
        )
        .map(conversationFromRecord);
    },

    async getConversation(id, userId) {
      const record = await orm.findOneByService("chat.conversation", {
        id,
        user_id: userId,
      });
      return record ? conversationFromRecord(record) : undefined;
    },

    async getMessages(conversationId, userId, limit = 100) {
      if (!(await this.getConversation(conversationId, userId))) return [];
      const records = await orm.findManyByService(
        "chat.message",
        { conversation_id: conversationId },
        { limit, orderBy: "rowid-asc" },
      );
      const messages = records.map(messageFromRecord);
      return Promise.all(
        messages.map(async (message) => {
          if (
            message.role !== "assistant" ||
            message.groundingStatus !== "grounded"
          ) {
            return message;
          }
          const citations = await orm.findManyByService(
            "chat.citation",
            {
              owner_id: userId,
              conversation_id: conversationId,
              message_id: message.id,
            },
            { limit: MAX_CITATIONS_PER_MESSAGE + 1, orderBy: "rowid-asc" },
          );
          if (citations.length > MAX_CITATIONS_PER_MESSAGE) {
            throw new Error("Stored message citation count exceeds its limit.");
          }
          return {
            ...message,
            citations: citations.map(citationReferenceFromRecord),
          };
        }),
      );
    },

    async addMessage(conversationId, userId, role, content, grounding) {
      const conversation = await this.getConversation(conversationId, userId);
      if (!conversation) throw new Error("Conversation not found.");
      const metadata = validateGroundingInput(role, grounding);
      const existing = await orm.findManyByService(
        "chat.message",
        { conversation_id: conversationId },
        { limit: 1, orderBy: "rowid-asc" },
      );
      const now = new Date();
      const record = await orm.createRecordForService("chat.message", {
        conversation_id: conversationId,
        role,
        content,
        ...(metadata.groundingStatus
          ? { grounding_status: metadata.groundingStatus }
          : {}),
        created_at: now,
      });
      for (const citation of metadata.citations) {
        await orm.createRecordForService("chat.citation", {
          owner_id: userId,
          conversation_id: conversationId,
          message_id: String(record.id),
          evidence_id: citation.evidenceId,
          edition_id: citation.editionId,
          edition_key: citation.editionKey,
          surah: citation.surah,
          ayah: citation.ayah,
          created_at: now,
        });
      }
      await orm.updateRecordsForService(
        "chat.conversation",
        { id: conversationId, user_id: userId },
        {
          updated_at: now,
          ...(role === "user" && existing.length === 0
            ? { title: content.trim().slice(0, 60) || "Percakapan baru" }
            : {}),
        },
      );
      return {
        ...messageFromRecord(record),
        citations: [...metadata.citations],
      };
    },

    async deleteConversation(id, userId) {
      const conversation = await this.getConversation(id, userId);
      if (!conversation) return false;
      await orm.deleteRecordsForService("chat.citation", {
        owner_id: userId,
        conversation_id: id,
      });
      await orm.deleteRecordsForService("chat.message", {
        conversation_id: id,
      });
      return (
        (await orm.deleteRecordsForService("chat.conversation", {
          id,
          user_id: userId,
        })) > 0
      );
    },

    close() {},
  };
}
