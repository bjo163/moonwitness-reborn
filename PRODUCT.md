# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

MoonWitness serves signed-in users through a web experience and API. Administrative and operational tasks are restricted to the existing `admin` and `operator` roles where applicable.

The local task-tracker utility is for the repository owner and developers who maintain this codebase.

## Product Purpose

MoonWitness is the primary software platform and implementation foundation of the A-L-L-A-H.COM ecosystem. Its target is one integrated Web/API application for working with knowledge and related experiences; the repository implements that direction incrementally, and the target architecture is not evidence that every capability is complete.

The local task tracker helps maintainers select and update project work from the canonical JSON register, with a generated `TODO.md` view kept in sync.

## Positioning

The platform's intended mechanism is one integrated application with explicit domain ownership and shared API contracts. Its implementation and release status must be reported only from current evidence.

The task tracker uses a checked-in JSON source of truth plus validation and Markdown generation, rather than a second independent task database.

## Operating Context

Developers work in a TypeScript/pnpm monorepo. The task register is maintained in `docs/governance/task-tracker.json`; `TODO.md` is generated from it and checked in CI. A small optional local browser UI may update task state while running on loopback.

## Capabilities and Constraints

- Domain data and ACLs belong to TypeScript `ql_*` addons managed by QlOrm; API contracts and routes are shared through `@moonwitness/moonclient`.
- The web application uses `moonClient` for HTTP and shared components from `@moonwitness/ui`.
- The local tracker utility uses Python's standard library and must bind only to loopback. It is a developer tool, not a production or public service.
- A task marked Done is not evidence of release; `CHANGELOG.md` records released work.
- Tracker task state, owner, dependencies, and acceptance criteria remain governed by the canonical JSON source and its validation rules.

## Brand Commitments

A-L-L-A-H.COM is the ecosystem identity and public gateway; MoonWitness is the integrated software platform. Preserve the official identity and editorial boundaries in `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`. Do not present proposals as completed product capabilities.

## Evidence on Hand

- Repository structure, product identity, and current implementation boundaries: `README.md`.
- Ecosystem identity and product/architecture distinction: `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`.
- Canonical task data and generated view: `docs/governance/task-tracker.json`, `TODO.md`.
- No production-readiness or deployment claim is established by this product record.

## Product Principles

1. Keep one canonical owner for each domain and task record.
2. Make task completion and release evidence distinct.
3. Keep access, dependencies, and operational changes explicit.
4. Prefer validated, traceable changes over parallel sources of truth.
5. Report implementation and deployment status honestly.
