# Internationalization Specification

**Status: Implemented foundation; Indonesian (`id`) and English (`en`) are enabled.**

## Scope and language boundaries

- The interface locale is separate from the language and authority of corpus editions, source passages, and authored content. Interface translation must never replace or obscure canonical text, attribution, or authority labels.
- Signed-in users persist their interface locale through the account preference API. Anonymous users persist it in browser storage. The default locale is Indonesian.
- Dates and numbers use locale-aware formatters. Timestamps remain canonical UTC values.
- API error codes remain stable and machine-readable; the web client maps safe errors to localized messages.
- Search normalization and source-text normalization are separate from interface translation.

## Architecture

- `packages/ql_i18n` is the TypeScript addon for language and translation records. Its models, ownership, access rules, and views are declared through the addon manifest and QlOrm; application tables must not be added through Drizzle or standalone migrations.
- `packages/ql_i18n/i18n/{id,en}.po` are the bundled source catalogs. PO contexts use `namespace:key`; the build validates key shape, duplicate keys, matching locale key sets, plural forms, and placeholder compatibility, then emits typed message keys and catalogs.
- The web application uses the shared translation provider and `@moonwitness/moonclient`. Published server catalog entries override bundled entries; bundled messages provide the initial render and outage fallback. A catalog load or refresh failure is surfaced with an in-app alert and retry action.
- Runtime message keys are namespaced. Translation metadata keys are carried in shared DTOs for addon model, field, view, connector-kind, and role labels. The metadata translator checks the active published catalog first, then the bundled catalog, and finally preserves the source label as a safe fallback. Unknown metadata keys therefore remain extensible without weakening the typed key contract used by ordinary UI messages.
- Private model fields remain excluded from metadata responses. Translation metadata is descriptive only and does not change ACLs, field values, or domain behavior.

## Translation lifecycle

1. The admin translation workspace can list and edit catalog entries as drafts, import PO entries as drafts, and export a locale catalog.
2. An authorized administrator reviews and explicitly approves a draft before it is published to the public catalog endpoint.
3. If a server-side model provider is configured, an administrator can request an AI translation draft. The provider receives only the requested source text and optional UI context; AI output is never published automatically and must pass the same human approval flow.
4. Placeholder names and supported plural forms are validated before drafts are saved or PO files are compiled. Indonesian currently uses `other`; English uses `one` and `other`.
5. Account locale changes and published-catalog refreshes use the shared client/API contracts. Web code must not introduce direct `fetch`, XMLHttpRequest, or a second HTTP client.

## Current coverage and boundaries

The typed catalogs cover the public landing/authentication and primary application surfaces, and the workspace localization pass includes dashboard/assistant, providers, connectors and DNS, model metadata, user administration, workflow review, and corpus shelf/reader. Connector kinds and roles expose localized metadata keys through API DTOs rather than requiring web-side label tables.

Coverage is incremental rather than a guarantee that every future addon or third-party-provided string is translated. New UI messages must be added to both PO catalogs and referenced with typed keys. New addon metadata should provide stable translation keys; runtime-only metadata can use a published catalog translation and otherwise falls back to its source label. Technical identifiers, canonical content, and user-authored text are not automatically translated.

## Testing and release checks

- Test PO parsing, placeholders, plural forms, draft privacy, approval, import/export, unsupported locales, and API authorization.
- Test locale preference persistence, runtime-catalog override and bundled fallback, metadata-key fallback, error recovery, and private-field filtering.
- Verify keyboard/screen-reader labels, long strings, loading/error/empty states, and responsive layouts in both enabled locales.
- Add RTL-specific layout primitives and tests before enabling an RTL locale; a language label alone is not sufficient.
- Run the relevant addon/API/web tests, workspace typecheck/lint, and production build before release.
