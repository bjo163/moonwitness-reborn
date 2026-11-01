export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SRV",
  "LOC",
  "CERT",
  "SSHFP",
  "TLSA",
  "URI",
  "SMIMEA",
  "DNAME",
  "HTTPS",
  "SVCB",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

/** Cloudflare only proxies these three, and proxying forces TTL to Auto (1). */
export const PROXIABLE_TYPES: readonly RecordType[] = ["A", "AAAA", "CNAME"];

export const AUTO_TTL = 1;
export const MAX_TTL = 1209600;

export function isRecordType(value: unknown): value is RecordType {
  return (
    typeof value === "string" &&
    (RECORD_TYPES as readonly string[]).includes(value.toUpperCase())
  );
}

/** Zone names and record hostnames compare case-insensitively, without the trailing dot. */
export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export function isApexName(name: string, zoneName: string): boolean {
  return normalizeName(name) === normalizeName(zoneName);
}

/**
 * Structural rules only; content syntax is Cloudflare's call so its own error
 * message reaches the operator instead of a guess from us.
 */
export function validateRecordCombination(input: {
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  zoneName: string;
}): string | undefined {
  const type = input.type.toUpperCase();
  if (!(RECORD_TYPES as readonly string[]).includes(type)) {
    return `Jenis record '${input.type}' tidak dikenal oleh Cloudflare.`;
  }
  if (!input.name.trim()) return "Nama record wajib diisi.";
  if (!input.content.trim()) return "Content record wajib diisi.";
  if (!Number.isInteger(input.ttl) || input.ttl < AUTO_TTL || input.ttl > MAX_TTL) {
    return `TTL harus bilangan bulat antara ${AUTO_TTL} dan ${MAX_TTL} detik (1 berarti Auto).`;
  }
  if (input.proxied && !PROXIABLE_TYPES.includes(type as RecordType)) {
    return `Record ${type} tidak bisa di-proxy; hanya A, AAAA, dan CNAME.`;
  }
  if (input.proxied && input.ttl !== AUTO_TTL) {
    return "Record yang di-proxy wajib memakai TTL Auto (1).";
  }
  if (type === "CNAME" && isApexName(input.name, input.zoneName)) {
    return "CNAME tidak boleh dipasang di apex domain; gunakan A/AAAA.";
  }
  return undefined;
}

export function ttlLabel(ttl: number): string {
  if (ttl === AUTO_TTL) return "Auto";
  if (ttl % 3600 === 0) return `${ttl / 3600} jam`;
  if (ttl % 60 === 0) return `${ttl / 60} menit`;
  return `${ttl} detik`;
}
