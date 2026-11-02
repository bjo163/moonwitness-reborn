# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

MoonWitness serves signed-in users through a web experience and API. Administrative and operational tasks are restricted to the existing `admin` and `operator` roles where applicable.

GitHub Issues are the task register for maintainers; the GitHub Wiki is the canonical home for project documentation.

## Product Purpose

MoonWitness is the primary software platform and implementation foundation of the A-L-L-A-H.COM ecosystem. Its target is one integrated Web/API application for working with knowledge and related experiences; the repository implements that direction incrementally, and the target architecture is not evidence that every capability is complete.

Maintainers plan and report project work through GitHub Issues. Current status is the Issue open/closed state and status label; stable `MW-NNNN` IDs connect dependencies, acceptance criteria, and evidence.

## Positioning

The platform's intended mechanism is one integrated application with explicit domain ownership and shared API contracts. Its implementation and release status must be reported only from current evidence.

The repository does not keep a second task database, generated TODO list, or project board. Read-only CI validation checks Issue IDs and dependencies against the public GitHub Issues API.

## Operating Context

Developers work in a TypeScript/pnpm monorepo. Project specifications and governance documents live in the GitHub Wiki. Agent workflow instructions remain in `.github/skills/` and `AGENTS.md`.

## Capabilities and Constraints

- Domain data and ACLs belong to TypeScript `ql_*` addons managed by QlOrm; API contracts and routes are shared through `@moonwitness/moonclient`.
- The web application uses `moonClient` for HTTP and shared components from `@moonwitness/ui`.
- GitHub Issues are canonical for task state, dependencies, acceptance criteria, and evidence; the Wiki is canonical for human-authored project documentation.
- A task marked Done is not evidence of release; `CHANGELOG.md` records released work.
- A task marked Done is not evidence of release; `CHANGELOG.md` records released work.

## Brand Commitments

A-L-L-A-H.COM is the ecosystem identity and public gateway; MoonWitness is the integrated software platform. Preserve the official identity and editorial boundaries in `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`. Do not present proposals as completed product capabilities.

## Evidence on Hand

- Repository structure, product identity, and current implementation boundaries: `README.md`.
- Ecosystem identity and product/architecture distinction: `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`.
- Canonical project tasks: [GitHub Issues](https://github.com/bjo163/moonwitness-reborn/issues); canonical project documentation: [GitHub Wiki](https://github.com/bjo163/moonwitness-reborn/wiki).
- No production-readiness or deployment claim is established by this product record.

## Product Principles

1. Keep one canonical owner for each domain and task record.
2. Make task completion and release evidence distinct.
3. Keep access, dependencies, and operational changes explicit.
4. Prefer validated, traceable changes over parallel sources of truth.
5. Report implementation and deployment status honestly.
