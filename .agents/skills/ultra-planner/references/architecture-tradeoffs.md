# Architecture Trade-offs Reference

## Trade-off Analysis Framework

### 1. When to Perform Trade-off Analysis

- Major architectural decisions
- Technology selection between credible alternatives
- Refactoring vs rewriting
- Build vs buy
- Consistency vs availability
- Simplicity vs flexibility
- Now vs later (technical debt)

### 2. Trade-off Analysis Template

```markdown
# Trade-off Analysis: [Decision Topic]

## Decision Context
- What decision needs to be made
- Why now
- Who is affected

## Options
### Option A: [Name]
[Description]

### Option B: [Name]
[Description]

### Option C: [Name] (if applicable)
[Description]

## Evaluation Criteria
| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| [Criterion 1] | XX% | [Why this matters] |
| [Criterion 2] | XX% | [Why this matters] |

## Scoring
| Criterion | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| [Criterion 1] | XX% | X/10 | Y/10 | Z/10 |
| [Criterion 2] | XX% | X/10 | Y/10 | Z/10 |
| **Weighted Total** | **100%** | **X.XX** | **Y.YY** | **Z.ZZ** |

## Detailed Comparison

### [Criterion 1]
**Option A:** [Assessment with evidence]
**Option B:** [Assessment with evidence]
**Option C:** [Assessment with evidence]

### [Criterion 2]
[Same structure]

## Risks & Mitigations

| Option | Risk | Likelihood | Impact | Mitigation |
|--------|------|------------|--------|------------|
| A | [Risk] | H/M/L | H/M/L | [Mitigation] |

## Reversibility
| Option | Reversibility | Cost to Reverse | Time to Reverse |
|--------|---------------|-----------------|-----------------|
| A | Easy/Medium/Hard | Low/Medium/High | [Estimate] |

## Long-term Consequences
| Option | 6 months | 1 year | 3 years |
|--------|----------|--------|---------|
| A | [Consequence] | [Consequence] | [Consequence] |

## Recommendation
**Selected:** Option [X]
**Rationale:** [Key reasons]
**Conditions:** [Assumptions that must hold]
**Deal-breakers:** [What would invalidate this choice]

## Dissenting Views
[Document any team disagreement and reasoning]

## Approval
- Analyst: [Name] — Date: [YYYY-MM-DD]
- Reviewer: [Name] — Date: [YYYY-MM-DD]
- Approver: [Name] — Date: [YYYY-MM-DD]
```

### 3. Common Architecture Trade-offs

| Trade-off | Option A | Option B | Typical Decision Factor |
|-----------|----------|----------|------------------------|
| **Monolith vs Microservices** | Simple deployment, shared DB | Independent scaling, team autonomy | Team size, domain complexity |
| **Sync vs Async** | Simplicity, immediate consistency | Resilience, decoupling | Latency tolerance, failure isolation |
| **SQL vs NoSQL** | ACID, relations, mature tooling | Flexibility, scale, schema evolution | Data structure, query patterns |
| **ORM vs Raw SQL** | Productivity, type safety | Performance, control | Team expertise, query complexity |
| **Build vs Buy** | Control, customization | Speed, maintenance burden | Core differentiator, budget |
| **Consistency vs Availability** | Strong consistency (CP) | High availability (AP) | Business requirement (CAP) |
| **Monorepo vs Polyrepo** | Atomic commits, shared code | Independent deploy, isolation | Team structure, release cadence |
| **Stateful vs Stateless** | Simpler logic, local data | Horizontal scale, resilience | Scaling needs, failure model |
| **Push vs Pull (Events)** | Lower latency, simpler consumer | Consumer control, backpressure | Volume, consumer diversity |
| **Schema-first vs Code-first** | Contract stability, multi-lang | Developer velocity, single source | Consumer count, change rate |

### 4. Decision Patterns

**Irreversible Decisions (One-Way Doors):**
- Database choice
- Cloud provider
- Core framework
- Language/runtime
- **Require:** Deep analysis, multiple stakeholders, documented rationale

**Reversible Decisions (Two-Way Doors):**
- Library choice
- Internal API design
- Coding conventions
- Tooling
- **Require:** Reasonable analysis, team consensus, reversal plan

### 5. Documenting Decisions in Specifications

Instead of separate ADRs, embed in relevant specification:

```markdown
## Decision: [Topic]

**Decision:** [What was chosen]
**Date:** [YYYY-MM-DD]
**Status:** Accepted

**Alternatives Considered:**
1. [Option A] — Rejected because [reason]
2. [Option B] — Rejected because [reason]

**Trade-offs Accepted:**
- [What we gained]
- [What we gave up]

**Risks:**
- [Risk 1] — Mitigation: [Plan]
- [Risk 2] — Mitigation: [Plan]

**Reversal Condition:** [What would trigger re-evaluation]

**Related:** SPEC-XXX, REQ-YYY
```

### 5. Trade-off Analysis Checklist

- [ ] Decision context clearly stated
- [ ] At least 2 credible options evaluated
- [ ] Evaluation criteria defined with weights
- [ ] Scoring with evidence (not opinions)
- [ ] Risks identified for each option
- [ ] Reversibility assessed
- [ ] Long-term consequences considered
- [ ] Team input gathered
- [ ] Dissenting views documented
- [ ] Recommendation with clear rationale
- [ ] Decision recorded in relevant specification
- [ ] Reversal conditions defined