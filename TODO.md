# MoonWitness Master TODO

**Canonical task and milestone status register.** Tasks marked `DONE` record completed planning or owner decisions; every remaining item is `PROPOSED` and does not authorize implementation. Update status here only; GitHub issues/projects may mirror approved tasks after ratification. IDs are unique. Do not claim completion without linked evidence.

## Gate 0 — Planning review

| ID | Task | Dependencies | Acceptance evidence | Status |
|---|---|---|---|---|
| MW-0001 | Review D01–D31 baseline and ratify scope, status labels and unresolved audit limits | None | Owner decision recorded against deliverable register | PROPOSED |
| MW-0002 | Document the current workspace baseline and its relation to candidate repositories | MW-0001 | Current origin, branch, SHA, tracked/untracked state and matching-tree evidence recorded in audit | DONE |
| MW-0003 | Ratify target architecture constraints and proposed addon/domain names | MW-0001 | Accepted ADRs and dependency graph with no duplicate owners | PROPOSED |
| MW-0004 | Select first user journey, audience and source/edition | MW-0001 | User outcome and source rights review approved | PROPOSED |
| MW-0005 | Decide unresolved identity, tenant, privacy, retention and publication policies | MW-0001 | Reviewed policy and security/privacy acceptance | PROPOSED |
| MW-0006 | Ratify whether `moonwitness-reborn` or `moonwitnessxv` is the primary repository | MW-0001 | Owner selected `moonwitness-reborn` in chat on 2026-11-01; ADR MW-ADR-001 records decision | DONE |

## Gate 1 — Complete evidence audit (read-only)

| ID | Task | Dependencies | Acceptance evidence | Status |
|---|---|---|---|---|
| MW-0101 | Pin exact branch/SHA and inspect source/config/tests/deployment for every relevant repo candidate | MW-0002 | Repository matrix contains exact SHA, evidence paths, findings and UNKNOWN fields | PROPOSED |
| MW-0102 | Inventory all corpus files, schemas, counts, IDs and materialization state | MW-0004 | Reproducible inventory report tied to source SHA/release | PROPOSED |
| MW-0103 | Map dataset/asset license and provenance at source/edition level | MW-0102 | Rights matrix with blocked/allowed actions and reviewer | PROPOSED |
| MW-0104 | Audit XV ARSY, SIGNAL/RADIO, Dock, Headquarters, AI Gateway, Sentinel, ORBIT and LUMEN components | MW-0101 | Capability map and per-component adopt/rebuild/import/reference decision | PROPOSED |
| MW-0105 | Audit MOONSKY/ECHOLOG contracts and identity/storage security | MW-0101 | Threat model, data classification and adapter recommendation | PROPOSED |
| MW-0106 | Reconcile character, narrative, research, ontology and ecosystem source material | MW-0101 | Canon/source registry with rights, IDs and uncertainty | PROPOSED |
| MW-0107 | Capture CI, rulesets, issues, releases and deployment evidence of selected repo | MW-0002 | Exact snapshot and governance evidence attached to audit and governance docs; absent releases/deployments recorded | DONE |

## Gate 2 — Ratified design, no feature code until acceptance

| ID | Task | Dependencies | Acceptance evidence | Status |
|---|---|---|---|---|
| MW-0201 | Finalize product specification and first-slice UX flows | MW-0004, MW-0103 | Approved user journey and explicit non-goals | PROPOSED |
| MW-0202 | Finalize canonical domain/entity owners and addon dependency DAG | MW-0003, MW-0104, MW-0106 | Registry with one owner/entity and no cycles | PROPOSED |
| MW-0203 | Specify QlOrm schema evolution and concurrency/recovery guarantees | MW-0003, MW-0101 | Accepted design and failure/restore test cases; no Drizzle/migrations | PROPOSED |
| MW-0204 | Finalize moonclient API contracts and error/security policy | MW-0003, MW-0201 | DTO/route inventory and contract test plan | PROPOSED |
| MW-0205 | Finalize identity, ACL, private-field and service-internal threat model | MW-0005, MW-0202 | Reviewed authorization matrix and abuse cases | PROPOSED |
| MW-0206 | Approve `@moonwitness/ui` token/accessibility and id/en plan | MW-0001, MW-0201 | Design review, theme and locale acceptance | PROPOSED |
| MW-0207 | Specify provenance, rights, correction, retention and publication lifecycle | MW-0103, MW-0201 | Reviewed state machine and records of blocked rights paths | PROPOSED |
| MW-0208 | Ratify first-slice API/data/UI acceptance and measurable quality targets | MW-0201–MW-0207 | Release-ready acceptance checklist, test plan and SLOs | PROPOSED |

## Gate 3 — Foundation implementation (eligible only after Gate 2 ratification)

| ID | Task | Dependencies | Acceptance evidence | Status |
|---|---|---|---|---|
| MW-0300 | Reproduce and repair lint/type resolution on a clean checkout before relying on CI | MW-0006, MW-0208 | Clean-runner lint/typecheck/test/build all pass on exact SHA; package build ordering is deterministic | PROPOSED |
| MW-0301 | Establish selected repo baseline and carry forward approved `AGENTS.md` constraints | MW-0002, MW-0208 | Clean branch, recorded SHA, verified workspace setup | PROPOSED |
| MW-0302 | Harden addon manifest loader and deterministic dependency validation | MW-0202, MW-0301 | Manifest/dependency negative tests pass | PROPOSED |
| MW-0303 | Close QlOrm ACL/private-field and service-owner enforcement gaps | MW-0205, MW-0302 | Cross-owner/private-field/internal service tests pass | PROPOSED |
| MW-0304 | Move domain/provider behavior behind owning `ql_*` services | MW-0202, MW-0204, MW-0303 | API boundary tests prove thin API; domain tests pass | PROPOSED |
| MW-0305 | Complete moonclient contract coverage and web client-only HTTP use | MW-0204, MW-0301 | Route/DTO tests and static web transport check pass | PROPOSED |
| MW-0306 | Implement approved light/dark and id/en shell through `@moonwitness/ui` | MW-0206, MW-0301 | Visual, localization, keyboard and responsive checks pass | PROPOSED |
| MW-0307 | Add operational health, structured redacted logs and environment validation | MW-0208, MW-0301 | Startup/failure/config tests and runbook reviewed; nonlocal startup rejects placeholder/default secret keys | PROPOSED |

## Gate 4 — First vertical slice and release

| ID | Task | Dependencies | Acceptance evidence | Status |
|---|---|---|---|---|
| MW-0401 | Implement source registration and rights/provenance view | MW-0103, MW-0207, MW-0302–MW-0305 | Rights and source tests pass; no unlicensed payload exposed | PROPOSED |
| MW-0402 | Import approved sample with ID mapping and rollback checkpoint | MW-0401 | Count/checksum reconciliation and rollback evidence | PROPOSED |
| MW-0403 | Implement passage reader and locale-aware source projection | MW-0402, MW-0306 | Edition/passage attribution and rights acceptance passes | PROPOSED |
| MW-0404 | Implement attributed claim/evidence draft and owner-safe service | MW-0202, MW-0303–MW-0305 | Domain, ACL, provenance and negative tests pass | PROPOSED |
| MW-0405 | Implement review, changes, approval and publication transitions | MW-0207, MW-0404 | Unauthorized transition, self-approval and rights-block tests pass | PROPOSED |
| MW-0406 | Run end-to-end first journey and accessibility/security verification | MW-0403, MW-0405 | Signed acceptance evidence in `id` and `en` | PROPOSED |
| MW-0407 | Prove backup/restore, release artifact and rollback on selected environment | MW-0406, MW-0307 | Restore and rollback evidence meets approved SLOs | PROPOSED |
| MW-0408 | Release first slice only after required review and governance gates | MW-0407 | Protected promotion, changelog, release record and acceptance | PROPOSED |

## Gate 5 — Domain expansion

Only create bounded tasks after the first slice establishes patterns. Candidate roadmap: ontology and search; people/events/witness; story and character; research/Mizan; journeys/actions; controlled AI assistance; approved integrations; scale/locales. Each needs a separate scope and acceptance record. No implied completion date or production readiness is set here.

## Mail server (a-l-l-a-h.com)

Owner request on 2026-11-01: email for `a-l-l-a-h.com` serving both a human mailbox and MoonWitness transactional mail. Self-hosted Stalwart on `163.61.134.104`, sender `app@a-l-l-a-h.com`. Code is done; the three infra gates below are owner-blocked.

| ID | Task | Dependencies | Acceptance evidence | Status |
|---|---|---|---|---|
| MW-0600 | Self-hosted Stalwart on the Coolify host: publish 25/465/587/993/995, no container 80/443, named volumes only, ACME via DNS-01, firewall inbound | Coolify token | Container healthy, IMAP/JMAP reachable, DKIM selector present in admin | PROPOSED |
| MW-0601 | Cloudflare DNS-only records: `mail` A, MX `10 mail.a-l-l-a-h.com.`, SPF `v=spf1 mx ~all`, DMARC `p=none`, DKIM copied from Stalwart admin | MW-0600 | FCrDNS both ways; `dig mail.a-l-l-a-h.com A` + `dig a-l-l-a-h.com MX` DNS-only | PROPOSED |
| MW-0602 | Outbound port 25 from `163.61.134.104` and a PTR that matches the HELO | None | `timeout 6 bash -c 'exec 3<>/dev/tcp/gmail-smtp-in.l.google.com/25'` succeeds; `dig -x 163.61.134.104` returns `mail.a-l-l-a-h.com.` | PROPOSED |
| MW-0603 | Create `bjo@`, `noreply@`, `dmarc@`, `app@` mailboxes; deploy Bulwark webmail; mail-tester >= 8.5/0% spam; inbox placement in Gmail/Outlook/Yahoo | MW-0601, MW-0602 | Test report with SPF+DKIM+DMARC PASS and inbound test received | PROPOSED |
| MW-0604 | Stage 4 code: nodemailer adapter, `res.verification` model, `/auth/forgot-password` and `/auth/reset-password`, web reset UI | Owner decision 2026-11-01 ("Kode Stage 4 langsung") | `pnpm lint`, `pnpm typecheck`, `pnpm test` green; 33 api + 8 ql_auth + 5 database + 3 moonclient tests pass | DONE |
