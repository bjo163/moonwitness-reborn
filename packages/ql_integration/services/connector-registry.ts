/**
 * Vocabulary for connector kinds. Transports live in their own addons; this
 * catalog only describes what the UI must render for a kind.
 */
export type ConnectorCapability = "dns";

export const MAX_CONNECTORS_PER_OWNER = 10;

export interface ConnectorKindDefinition {
  kind: string;
  labelKey: string;
  label: string;
  /**
   * Where MoonWitness looks for this service's credential. This is displayed,
   * never submitted: no connector kind accepts a token through the app.
   */
  credentialHelpKey: string;
  credentialHelp: string;
  helpUrl: string;
  capabilities: readonly ConnectorCapability[];
  /** Kinds whose token is expected to be read-only; the API refuses writes. */
  readonly: boolean;
}

export const CONNECTOR_KINDS: readonly ConnectorKindDefinition[] = [
  {
    kind: "cloudflare",
    labelKey: "web.connectors.kinds.cloudflare.label",
    label: "Cloudflare",
    credentialHelpKey: "web.connectors.kinds.cloudflare.credentialHelp",
    credentialHelp:
      "Token dibaca dari OS credential store (CLOUDFLARE_API_TOKEN, keychain, atau file konfigurasi CLI). Butuh permission Zone / DNS / Edit.",
    helpUrl: "https://dash.cloudflare.com/profile/api-tokens",
    capabilities: ["dns"],
    readonly: false,
  },
  {
    kind: "cloudflare_read",
    labelKey: "web.connectors.kinds.cloudflareRead.label",
    label: "Cloudflare (read-only)",
    credentialHelpKey: "web.connectors.kinds.cloudflareRead.credentialHelp",
    credentialHelp:
      "Token dibaca dari OS credential store yang sama. Buat token Zone / DNS / View di Cloudflare agar pembatasan ini juga berlaku di luar MoonWitness.",
    helpUrl: "https://dash.cloudflare.com/profile/api-tokens",
    capabilities: ["dns"],
    readonly: true,
  },
] as const;

const kinds = new Map(
  CONNECTOR_KINDS.map((definition) => [definition.kind, definition]),
);

export function findConnectorKind(kind: string): ConnectorKindDefinition | undefined {
  return kinds.get(kind);
}

export function isKnownConnectorKind(kind: unknown): kind is string {
  return typeof kind === "string" && kinds.has(kind);
}

export function connectorKindSupports(
  kind: string,
  capability: ConnectorCapability,
): boolean {
  return findConnectorKind(kind)?.capabilities.includes(capability) === true;
}

/** Unknown kinds are treated as read-only so a stale row cannot gain write access. */
export function connectorKindAllowsWrites(kind: string): boolean {
  const definition = findConnectorKind(kind);
  return definition !== undefined && definition.readonly === false;
}
