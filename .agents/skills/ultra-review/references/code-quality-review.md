# Code Quality & Logic Review Reference

## Evaluation Criteria

### 1. Correctness

| Aspect | Check Method | Pass Criteria |
|--------|--------------|---------------|
| Input Validation | All public entry points validate | No unvalidated external input reaches business logic |
| Null/Undefined Handling | Explicit checks, Option/Maybe types | No null pointer exceptions possible |
| Error Handling | Errors caught, logged, recovered or propagated | No silent failures, no catch-all without handling |
| Async Correctness | await used correctly, no floating promises | All promises handled, no race conditions |
| Concurrency | Locks, atomics, or immutable data | No data races, deadlocks, or lost updates |
| Resource Management | RAII, try/finally, using, defer | No leaks (memory, handles, connections) |

### 2. Type Safety

| Language | Target | Tools |
|----------|--------|-------|
| TypeScript | `strict: true`, no `any`, no `// @ts-ignore` | `tsc --noEmit` |
| Python | Type hints on all public APIs, mypy strict | `mypy --strict` |
| Go | No `interface{}` without reason, exhaustive switches | `go vet`, `staticcheck` |
| Rust | No `unwrap()` in production, no `unsafe` without docs | `cargo clippy --deny warnings` |
| Java/Kotlin | No raw types, nullability annotations | `spotbugs`, `detekt` |

### 3. Readability & Maintainability

| Metric | Good | Warning | Action |
|--------|------|---------|--------|
| Cyclomatic Complexity | < 10 per function | 10-20 | Refactor |
| Cognitive Complexity | < 15 per function | 15-30 | Refactor |
| Function Length | < 30 lines | 30-50 | Extract |
| Class/File Length | < 300 lines | 300-500 | Split |
| Nesting Depth | < 3 | 3-4 | Flatten |
| Parameter Count | < 4 | 4-6 | Group into object |

### 4. Naming Conventions

| Entity | Convention | Anti-Pattern |
|--------|------------|--------------|
| Variables/Functions | camelCase, descriptive verbs/nouns | `data`, `temp`, `x`, `doThing` |
| Classes/Types | PascalCase, noun phrases | `Manager`, `Helper`, `Util`, `Service` |
| Constants | UPPER_SNAKE_CASE | Magic numbers/strings |
| Booleans | `is`, `has`, `can`, `should` prefix | `flag`, `status`, `enabled` |
| Interfaces | Noun or adjective (TypeScript) | `I` prefix (legacy) |

### 5. Defensive Programming

| Pattern | When Required |
|---------|---------------|
| Input validation at boundaries | All public APIs, CLI, message handlers |
| Contract assertions (pre/post) | Critical invariants |
| Fail-fast on invalid state | Constructor, state transitions |
| Timeouts on external calls | All network, disk, IPC |
| Retry with backoff | Transient failures (network, DB) |
| Circuit breaker | Repeated external failures |
| Idempotency keys | Non-idempotent operations |

### 6. Code Duplication

| Threshold | Action |
|-----------|--------|
| > 3 identical lines | Extract function |
| > 5 similar blocks | Extract with parameters |
| Cross-package duplication | Shared package or library |

### 7. Dead Code Detection

| Type | Detection |
|------|-----------|
| Unused exports | `tsc --noEmit` + `knip` / `depcheck` |
| Unreachable code | Linter, coverage tools |
| Dead branches | Condition always true/false |
| Unused config | Not referenced in code |

## Language-Specific Checks

### TypeScript/JavaScript

```bash
# Type checking
tsc --noEmit

# Linting
eslint . --ext .ts,.tsx

# Dead code
knip  # or depcheck

# Complexity
eslint . --rule 'complexity: [error, 10]' --rule 'max-lines: [error, 300]'
```

### Python

```bash
# Type checking
mypy --strict --show-error-codes .

# Linting
ruff check .

# Complexity
radon cc . -n C -a
```

### Go

```bash
# Static analysis
go vet ./...
staticcheck ./...

# Complexity
gocyclo -over 10 .
```

### Rust

```bash
# Linting
cargo clippy --all-targets --all-features -- -D warnings

# Complexity (manual review)
```

## Common Code Smells

| Smell | Detection | Fix |
|-------|-----------|-----|
| Long Parameter List | > 4 params | Parameter object |
| Feature Envy | Method uses more of other class | Move method |
| Data Class | Only getters/setters, no behavior | Add behavior or use struct |
| Switch on Type | `if (x instanceof A)` | Polymorphism/visitor |
| Speculative Generality | Unused abstraction | YAGNI - remove |
| Message Chains | `a.getB().getC().doD()` | Hide delegation |
| Middle Man | Delegates everything | Remove indirection |
| Inappropriate Intimacy | Classes know too much about each other | Reduce coupling |

## Code Quality Scorecard

| Dimension | Weight | Score (0-100) | Evidence |
|-----------|--------|---------------|----------|
| Correctness | 30% | | Type check, tests, validation |
| Type Safety | 20% | | Strict mode, no `any`, mypy clean |
| Readability | 15% | | Complexity metrics, naming |
| Maintainability | 15% | | Duplication, dead code, coupling |
| Defensive Coding | 10% | | Error handling, timeouts, contracts |
| Consistency | 10% | | Style guide, patterns, conventions |

**Overall = Σ(weight × score)**

## Investigation Checklist

- [ ] Run type checker — zero errors?
- [ ] Run linter — zero errors? (warnings reviewed)
- [ ] Check complexity metrics — any > threshold?
- [ ] Search for `TODO`, `FIXME`, `HACK` — triage
- [ ] Search for `console.log`, `print`, `println` — remove or use logger
- [ ] Search for `any`, `unknown`, `interface{}`, `Object` — justify each
- [ ] Search for `unwrap()`, `expect()`, `panic!()` — justify each
- [ ] Check test coverage — critical paths covered?
- [ ] Review error handling paths — all covered?
- [ ] Verify resource cleanup — all paths?
- [ ] Check for hardcoded secrets/URLs — none in source