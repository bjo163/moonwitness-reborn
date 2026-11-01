import {
  createHash,
  randomBytes,
  scrypt as callbackScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  ConversationStore,
  PublicUser,
  User,
} from "@moonwitness/database";

const scrypt = promisify(callbackScrypt);
const SESSION_COOKIE = "ql_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_BYTES = 64;
const TOKEN_BYTES = 32;

export const VERIFICATION_TTL_SECONDS = 60 * 30;
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

export class AuthenticationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export function publicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < 12 || password.length > 256) {
    throw new AuthenticationError(
      "Kata sandi harus terdiri dari 12 hingga 256 karakter.",
      400,
    );
  }
  return password;
}

export function validateCredentials(
  name: unknown,
  email: unknown,
  password: unknown,
): { name: string; email: string; password: string } {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    throw new AuthenticationError("Nama wajib diisi (maksimal 100 karakter).", 400);
  }
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new AuthenticationError("Alamat email tidak valid.", 400);
  }
  return {
    name: name.trim(),
    email: normalizeEmail(email),
    password: validatePassword(password),
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, PASSWORD_BYTES)) as Buffer;
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (
    algorithm !== "scrypt" ||
    !salt ||
    !/^[a-f0-9]{128}$/i.test(expectedHex ?? "")
  ) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return timingSafeEqual(actual, expected);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashVerificationToken(token: string): string {
  return hashToken(token);
}

/** Untrusted input first, so a long token never reaches `hashToken`. */
export function normalizeVerificationToken(token: unknown): string | undefined {
  return typeof token === "string" && /^[A-Za-z0-9_-]{40,50}$/.test(token)
    ? token
    : undefined;
}

export function generateVerificationToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

function parseCookies(request: IncomingMessage): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name) cookies.set(name, valueParts.join("="));
  }
  return cookies;
}

function cookieAttributes(): string {
  return [
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_LIFETIME_SECONDS}`,
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");
}

export async function issueSession(
  response: ServerResponse,
  store: ConversationStore,
  userId: string,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await store.createSession(
    userId,
    hashToken(token),
    new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000),
  );
  response.setHeader(
    "set-cookie",
    `${SESSION_COOKIE}=${token}; ${cookieAttributes()}`,
  );
}

export async function getAuthenticatedUser(
  request: IncomingMessage,
  store: ConversationStore,
): Promise<User | undefined> {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return undefined;
  return store.getSessionUser(hashToken(token));
}

export async function clearSession(
  request: IncomingMessage,
  response: ServerResponse,
  store: ConversationStore,
): Promise<void> {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (token && /^[A-Za-z0-9_-]{40,50}$/.test(token)) {
    await store.deleteSession(hashToken(token));
  }
  response.setHeader(
    "set-cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}
