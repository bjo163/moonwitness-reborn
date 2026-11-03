# Technology Research Reference

## Research Methodology

### 1. When to Research

Research is required when:
- Selecting new technology for the stack
- Current technology approaching EOL
- Security vulnerability in current dependency
- Performance requirements exceed current capability
- New requirement not met by current stack
- Team lacks expertise in current technology

### 2. Research Sources (Priority Order)

| Tier | Sources | Reliability |
|------|---------|-------------|
| **Primary** | Official docs, release notes, RFCs, specs | HIGH |
| **Secondary** | Maintainer blogs, GitHub discussions, RFC repos | HIGH |
| **Tertiary** | Reputable tech blogs, conference talks, case studies | MEDIUM |
| **Community** | StackOverflow, Reddit, Discord, Twitter | LOW (verify) |
| **Vendor** | Marketing pages, sales engineers | BIASED (verify independently) |

### 3. Version & Maintenance Verification

**For Each Candidate Technology:**

```markdown
## Technology: [Name]
## Current Version: [X.Y.Z]
## Release Date: [YYYY-MM-DD]

### Maintenance Status
- [ ] Active development (commits last 30 days)
- [ ] Regular releases (last 90 days)
- [ ] LTS version available
- [ ] LTS support timeline: [End date]
- [ ] Security policy documented (SECURITY.md)
- [ ] Recent security advisories: [Count, severity]

### Compatibility
- [ ] Node.js/Python/Go version compatibility
- [ ] Dependency compatibility (peer deps)
- [ ] Breaking changes in recent versions
- [ ] Migration guide for latest major

### Ecosystem Health
- [ ] Weekly downloads (npm/PyPI/crates.io)
- [ ] Dependent packages count
- [ ] Contributors (last 1 year)
- [ ] Open issues / PRs ratio
- [ ] Mean time to close issues

### Documentation Quality
- [ ] Getting started guide
- [ ] API reference
- [ ] Migration guides
- [ ] Best practices
- [ ] TypeScript types (if applicable)
```

### 4. Security Research

**For Each Dependency:**

1. **Check Advisories:**
   - `npm audit` / `cargo audit` / `go vulncheck` / `pip-audit`
   - GitHub Security Advisories
   - NVD (National Vulnerability Database)
   - Snyk / Sonatype OSS Index

2. **Assess Severity:**
   - CVSS score
   - Exploitability (PoC available?)
   - Affected versions
   - Patch availability

3. **Mitigation:**
   - Upgrade path
   - Workaround (config, WAF)
   - Acceptance risk (if no fix)

### 5. Performance Research

**For Performance-Critical Decisions:**

1. **Benchmark Sources:**
   - Official benchmarks (verify methodology)
   - Independent benchmarks (TechEmpower, etc.)
   - Run own benchmark with realistic workload

2. **Key Metrics:**
   - Throughput (req/s, ops/s)
   - Latency (p50, p95, p99)
   - Resource usage (CPU, memory, network)
   - Scaling behavior

3. **Workload Similarity:**
   - Benchmark must match your access patterns
   - Data size, concurrency, read/write ratio

### 6. Migration Cost Research

**For Technology Migration:**

| Factor | Assessment |
|--------|------------|
| **API Compatibility** | Drop-in replacement / Adapter needed / Rewrite |
| **Data Migration** | Schema compatible / Transform needed / Rebuild |
| **Test Coverage** | Existing tests sufficient / New tests needed |
| **Team Training** | None / Workshop / Extended learning |
| **Operational Changes** | None / Config / New tools / New expertise |
| **Rollback Complexity** | Trivial / Moderate / Difficult / Impossible |

### 7. Research Documentation Template

```markdown
# Technology Research: [Technology Name]

## Research Context
- Decision needed: [What and why]
- Deadline: [Date]
- Decision maker: [Name/Role]

## Candidates
| Candidate | Version | Source |
|-----------|---------|--------|
| A | X.Y.Z | [Link] |
| B | X.Y.Z | [Link] |

## Evaluation

### Candidate A
**Functional Fit:** [Assessment]
**Maturity:** [Assessment + evidence]
**Security:** [Advisories checked, status]
**Performance:** [Benchmarks, methodology]
**Operations:** [Complexity, expertise needed]
**Compatibility:** [Stack fit, migration cost]
**Community:** [Health indicators]

### Candidate B
[Same structure]

## Comparison Matrix
| Criterion | Weight | Candidate A | Candidate B |
|-----------|--------|-------------|-------------|
| Functional Fit | 25% | 9/10 | 7/10 |
| Maturity | 15% | 8/10 | 9/10 |
| Security | 15% | 8/10 | 8/10 |
| Performance | 15% | 7/10 | 9/10 |
| Operations | 10% | 6/10 | 8/10 |
| Compatibility | 10% | 9/10 | 6/10 |
| Community | 5% | 8/10 | 7/10 |
| Cost | 5% | 8/10 | 7/10 |
| **Weighted Score** | **100%** | **7.95** | **7.65** |

## Recommendation
**Selected:** Candidate A
**Rationale:** [Key reasons]
**Conditions:** [Assumptions that must hold]
**Risks:** [Identified risks]
**Mitigations:** [Planned mitigations]
**Reversal Trigger:** [What would cause re-evaluation]

## Sources
- [Source 1] - [Date accessed] - [Relevance]
- [Source 2] - [Date accessed] - [Relevance]

## Researcher
- Name: [Name]
- Date: [YYYY-MM-DD]
- Confidence: HIGH/MEDIUM/LOW
```

### Research Best Practices

- **Time-box research** (e.g., 2 hours for minor, 2 days for major)
- **Verify claims** — don't trust benchmarks without methodology
- **Check dates** — tech changes fast, prefer sources < 6 months
- **Document negative findings** — why NOT to choose something
- **Involve team** — get input from those who'll use it
- **Record confidence level** — HIGH/MEDIUM/LOW
- **Set reversal triggers** — when to re-evaluate

### Research Checklist

- [ ] Official documentation reviewed
- [ ] Release notes for last 3 versions reviewed
- [ ] Security advisories checked (0 critical unpatched)
- [ ] Maintenance status verified (active, LTS available)
- [ ] Compatibility with current stack verified
- [ ] Performance benchmarks reviewed (or run)
- [ ] Migration cost from current tech assessed
- [ ] Team expertise gap assessed
- [ ] Community health indicators checked
- [ ] License compatibility verified
- [ ] Decision documented with rationale
- [ ] Reversal triggers defined
- [ ] Sources cited with dates