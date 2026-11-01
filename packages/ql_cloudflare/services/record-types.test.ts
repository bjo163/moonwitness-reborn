import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTO_TTL,
  MAX_TTL,
  PROXIABLE_TYPES,
  RECORD_TYPES,
  isApexName,
  isRecordType,
  normalizeName,
  ttlLabel,
  validateRecordCombination,
} from "./record-types.js";

const zoneName = "example.com";

function draft(
  overrides: Partial<Parameters<typeof validateRecordCombination>[0]> = {},
) {
  return {
    name: "api.example.com",
    type: "A",
    content: "203.0.113.10",
    ttl: AUTO_TTL,
    proxied: false,
    zoneName,
    ...overrides,
  };
}

void test("the proxiable list stays the Cloudflare subset of known types", () => {
  assert.deepEqual([...PROXIABLE_TYPES], ["A", "AAAA", "CNAME"]);
  for (const type of PROXIABLE_TYPES) {
    assert.ok((RECORD_TYPES as readonly string[]).includes(type));
  }
  assert.equal(isRecordType("cname"), true, "types compare case-insensitively");
  assert.equal(isRecordType("MX "), false, "surrounding space is not trimmed here");
  assert.equal(isRecordType(""), false);
});

void test("a valid combination passes every structural rule", () => {
  assert.equal(validateRecordCombination(draft()), undefined);
  assert.equal(
    validateRecordCombination(draft({ type: "a", ttl: 300 })),
    undefined,
    "lowercase types are Cloudflare's vocabulary, not a rejection",
  );
  assert.equal(
    validateRecordCombination(draft({ type: "CNAME", name: "www.example.com", content: "origin.example.com" })),
    undefined,
  );
});

void test("names and content must both be present", () => {
  assert.match(validateRecordCombination(draft({ name: "   " })) ?? "", /Nama record/);
  assert.match(validateRecordCombination(draft({ content: "" })) ?? "", /Content record/);
});

void test("unknown types are refused before Cloudflare sees them", () => {
  const problem = validateRecordCombination(draft({ type: "WEIRD" }));
  assert.match(problem ?? "", /tidak dikenal/);
});

void test("TTL must be a whole number inside the Cloudflare range", () => {
  assert.match(validateRecordCombination(draft({ ttl: 0 })) ?? "", /TTL/);
  assert.match(validateRecordCombination(draft({ ttl: 1.5 })) ?? "", /TTL/);
  assert.match(validateRecordCombination(draft({ ttl: MAX_TTL + 1 })) ?? "", /TTL/);
  assert.equal(validateRecordCombination(draft({ ttl: MAX_TTL })), undefined);
});

void test("proxying is limited to the three types and forces Auto TTL", () => {
  assert.equal(validateRecordCombination(draft({ type: "A", proxied: true })), undefined);
  assert.match(
    validateRecordCombination(draft({ type: "TXT", content: "v=spf1 -all", proxied: true })) ?? "",
    /tidak bisa di-proxy/,
  );
  assert.match(
    validateRecordCombination(draft({ proxied: true, ttl: 300 })) ?? "",
    /TTL Auto/,
  );
});

void test("a CNAME may not sit on the zone apex, in any spelling", () => {
  for (const name of [zoneName, "EXAMPLE.COM.", ` ${zoneName} `]) {
    const problem = validateRecordCombination(
      draft({ type: "CNAME", name, content: "origin.example.com" }),
    );
    assert.match(problem ?? "", /apex domain/, `'${name}' is the apex`);
  }
  assert.equal(
    validateRecordCombination(draft({ type: "A", name: zoneName })),
    undefined,
    "A at the apex is the recommended replacement",
  );
});

void test("names compare case-insensitively and without a trailing dot", () => {
  assert.equal(normalizeName("  API.Example.COM. "), "api.example.com");
  assert.equal(isApexName("example.com.", "EXAMPLE.COM"), true);
  assert.equal(isApexName("@", "example.com"), false, "Cloudflare's @ shorthand is upstream's job");
  assert.equal(isApexName("www.example.com", "example.com"), false);
});

void test("ttlLabel keeps Auto and the coarse units readable", () => {
  assert.equal(ttlLabel(AUTO_TTL), "Auto");
  assert.equal(ttlLabel(3600), "1 jam");
  assert.equal(ttlLabel(300), "5 menit");
  assert.equal(ttlLabel(45), "45 detik");
});
