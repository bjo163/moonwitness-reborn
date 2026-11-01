# Internationalization Specification

**Status: PROPOSED target; `id` and `en` are the initial locales from masterprompt.**

## Scope

- UI locales: Indonesian (`id`) and English (`en`) from the first release.
- User-selectable locale with deterministic fallback; persist per user where signed in and locally for anonymous users.
- All UI strings localized; no text embedded in icons/images.
- Content language is separate from UI locale. Corpus edition/translation and authored commentary carry their own BCP 47 language tags.
- Dates, numbers, time zones and collation use locale-aware formatting; canonical timestamps stored in UTC.
- API error codes remain stable and machine-readable; safe user messages can be localized by client.
- Search defines language-aware tokenization and normalization without altering source text.

## Implementation rules

Use namespaced message catalogs with typed keys; fail lint/build on missing required translations where feasible. Never use translation as a substitute for canonical original text. Preserve exact punctuation and normalization metadata for source passages. Include locale in cache keys when response is localized. Avoid concatenating fragments that break grammar.

## Testing

Test locale switch and persistence, missing-key fallback, long-string layout, date/time formatting, search locale and mixed-language content, keyboard/screen reader labels in both locales, and responsive layout. Add RTL-ready primitives before an RTL locale is approved.

## Current gap

Workspace search found no locale framework and web CSS declares dark color scheme. No `id`/`en` catalog or localization coverage is verified. Select the library and message ownership after checking current dependencies; do not add a second UI design system.
