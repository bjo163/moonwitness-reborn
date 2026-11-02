import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const KEY_BYTES = 32;

export function parseProviderEncryptionKey(value: string | undefined) {
  const key = value?.trim();
  if (key === undefined || key === "") return undefined;
  if (!/^[\da-f]{64}$/i.test(key)) {
    throw new Error("PROVIDER_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.");
  }
  return Buffer.from(key, "hex");
}

export function encryptProviderSecret(
  secret: string,
  key: Buffer<ArrayBufferLike>,
): string {
  if (key.length !== KEY_BYTES) {
    throw new Error("Provider encryption key must be 32 bytes.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptProviderSecret(
  value: string,
  key: Buffer<ArrayBufferLike>,
): string {
  if (key.length !== KEY_BYTES) {
    throw new Error("Provider encryption key must be 32 bytes.");
  }
  const [encodedIv, encodedTag, encodedCiphertext, extra] = value.split(".");
  if (
    encodedIv === undefined ||
    encodedIv === "" ||
    encodedTag === undefined ||
    encodedTag === "" ||
    encodedCiphertext === undefined ||
    encodedCiphertext === "" ||
    extra !== undefined
  ) {
    throw new Error("Stored provider credential has an invalid format.");
  }
  const iv = Buffer.from(encodedIv, "base64url");
  const tag = Buffer.from(encodedTag, "base64url");
  const ciphertext = Buffer.from(encodedCiphertext, "base64url");
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error("Stored provider credential has an invalid format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
