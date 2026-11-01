import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptProviderSecret,
  encryptProviderSecret,
  parseProviderEncryptionKey,
} from "./provider-secrets.js";

void test("provider secrets encrypt and decrypt using authenticated encryption", () => {
  const key = Buffer.alloc(32, 7);
  const encrypted = encryptProviderSecret("provider-secret", key);
  assert.notEqual(encrypted, "provider-secret");
  assert.equal(decryptProviderSecret(encrypted, key), "provider-secret");
  assert.throws(() => decryptProviderSecret(encrypted, Buffer.alloc(32, 8)));
});

void test("encryption key configuration must be 32-byte hexadecimal", () => {
  assert.equal(parseProviderEncryptionKey(undefined), undefined);
  assert.equal(parseProviderEncryptionKey("ab".repeat(32))?.length, 32);
  assert.throws(() => parseProviderEncryptionKey("not-a-key"), /64 hexadecimal/);
});
