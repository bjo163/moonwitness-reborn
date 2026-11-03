# UI/UX & Design System Review Reference

## Accessibility (WCAG 2.1 AA)

### Perceivable

| Criterion | Check | Tool |
|-----------|-------|------|
| 1.1.1 Non-text content | All images have alt, icons aria-hidden | axe, WAVE |
| 1.3.1 Info & relationships | Semantic HTML, heading hierarchy | axe, manual |
| 1.4.3 Contrast (AA) | 4.5:1 normal, 3:1 large text | axe, contrast checker |
| 1.4.4 Resize text | 200% zoom works, no horizontal scroll | Browser zoom |
| 1.4.11 Non-text contrast | 3:1 UI components, graphics | axe |
| 1.4.12 Text spacing | Line height 1.5, paragraph 2x, letter 0.12x, word 0.16x | Manual |

### Operable

| Criterion | Check | Tool |
|-----------|-------|------|
| 2.1.1 Keyboard | All functionality via keyboard | Tab through |
| 2.1.2 No keyboard trap | Focus moves freely | Tab through |
| 2.4.3 Focus order | Logical tab order | Tab through |
| 2.4.7 Focus visible | Clear focus indicator | Tab through |
| 2.5.3 Label in name | Accessible name includes visible label | axe |
| 2.5.5 Target size | 44×44px minimum (AAA) | Manual |

### Understandable

| Criterion | Check | Tool |
|-----------|-------|------|
| 3.1.1 Language of page | `lang` attribute | axe |
| 3.2.1 On focus | No unexpected changes on focus | Manual |
| 3.2.2 On input | No unexpected changes on input | Manual |
| 3.3.1 Error identification | Errors described in text | Manual |
| 3.3.2 Labels/instructions | Form fields have labels | axe |

### Robust

| Criterion | Check | Tool |
|-----------|-------|------|
| 4.1.1 Parsing | Valid HTML, no duplicate IDs | Validator, axe |
| 4.1.2 Name/role/value | Custom controls have ARIA | axe, screen reader |
| 4.1.3 Status messages | Announced via ARIA live | Screen reader |

## Design System Consistency

### Design Tokens

| Token Category | Required | Documentation |
|----------------|----------|---------------|
| Colors | Primary, secondary, semantic (success/warning/error), neutral | Figma/Storybook |
| Spacing | Scale (4px base), consistent usage | Design tokens |
| Typography | Font families, sizes, weights, line heights | Design tokens |
| Border radius | Scale, consistent per component type | Design tokens |
| Shadows | Elevation scale | Design tokens |
| Transitions | Duration, easing | Design tokens |
| Z-index | Layer scale (dropdown, modal, toast) | Design tokens |

### Component Library

| Component | States Required | Variants |
|-----------|-----------------|----------|
| Button | default, hover, active, focus, disabled, loading | primary, secondary, ghost, danger, sizes |
| Input | default, hover, focus, error, disabled, filled | text, textarea, select, sizes |
| Card | default, hover, selected | elevated, outlined, filled |
| Modal | open, closing, closed | sizes, scroll behavior |
| Dropdown | open, closed, loading, error | single, multi, searchable |
| Table | sorting, filtering, pagination, selection | density, sticky header |
| Toast | success, error, warning, info | dismissible, actionable |

### Visual Consistency Checks

| Check | Method |
|-------|--------|
| Color usage | Only design token colors used |
| Spacing | Only design token spacing used |
| Typography | Only design token typography used |
| Border radius | Consistent per component category |
| Shadows | Only design token shadows used |
| Icon set | Single icon library, consistent style |

## Responsive Design

### Breakpoints

| Breakpoint | Min Width | Target Devices |
|------------|-----------|----------------|
| Mobile | 320px | Phones |
| Tablet | 768px | Tablets, small laptops |
| Desktop | 1024px | Laptops, monitors |
| Wide | 1440px | Large monitors |

### Responsive Requirements

| Requirement | Check |
|-------------|-------|
| No horizontal overflow | `overflow-x: hidden` on body, test at 320px |
| Touch targets | 44×44px minimum on mobile |
| Text readable | No zoom required, 16px base minimum |
| Navigation usable | Hamburger menu, accessible |
| Tables responsive | Horizontal scroll, card view, or stack |
| Forms usable | Full-width inputs, stacked labels |

## UI States (Required for Every Data-Displaying Component)

| State | Implementation |
|-------|----------------|
| Loading | Skeleton, spinner, progress, not blank |
| Empty | Illustrative, actionable (CTA to create), not blank |
| Error | Message, retry action, not generic |
| Success | Confirmation, next steps |
| Partial | Some data, some loading (streaming) |

## Interaction Design

### Feedback

| Interaction | Feedback Required |
|-------------|-------------------|
| Button click | Visual (ripple, color), loading if async |
| Form submit | Loading, success/error toast, inline validation |
| Navigation | Transition, loading if slow |
| Drag/drop | Visual drag preview, drop zones highlighted |
| Hover/focus | Clear state change |

### Motion

| Principle | Guideline |
|-----------|-----------|
| Purposeful | Motion guides attention, explains relationships |
| Performant | 60fps, `transform`/`opacity` only, `will-change` |
| Respectful | `prefers-reduced-motion: reduce` honored |
| Duration | < 200ms simple, < 500ms complex |
| Easing | `ease-out` for entering, `ease-in` for exiting |

## Internationalization (i18n)

| Requirement | Implementation |
|-------------|----------------|
| No hardcoded strings | All text in translation files |
| RTL support | Logical properties (`margin-inline-start`), `dir` attribute |
| Number/date formatting | `Intl.NumberFormat`, `Intl.DateTimeFormat` |
| Pluralization | ICU MessageFormat |
| Font fallback | Noto Sans for CJK, appropriate fallbacks |
| Layout flexibility | No fixed widths for text containers |

## Performance (Frontend)

### Metrics

| Metric | Target | Tool |
|--------|--------|------|
| LCP | < 2.5s | Lighthouse, WebPageTest |
| INP | < 200ms | Lighthouse, RUM |
| CLS | < 0.1 | Lighthouse, RUM |
| TBT | < 200ms | Lighthouse |
| Bundle size (JS gzipped) | < 100KB initial | Bundle analyzer |

### Optimization Checklist

- [ ] Code splitting by route
- [ ] Lazy load below-fold images/components
- [ ] Virtualize long lists
- [ ] Memoize expensive computations
- [ ] Optimize images (WebP/AVIF, responsive)
- [ ] Preload critical fonts
- [ ] Minimize render-blocking resources
- [ ] Use `fetchpriority="high"` for hero image
- [ ] Defer non-critical third-party scripts

## UI/UX Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Accessibility | 25% | | WCAG 2.1 AA, axe score |
| Design System | 20% | | Token usage, component coverage |
| Responsiveness | 15% | | Breakpoints, touch targets |
| UI States | 15% | | Loading, empty, error, partial |
| Interaction | 10% | | Feedback, motion, purpose |
| i18n | 5% | | No hardcoded strings, RTL |
| Performance | 10% | | Core Web Vitals, bundle |

## Investigation Checklist

- [ ] Run axe-core — zero violations?
- [ ] Tab through entire app — focus visible, logical order?
- [ ] Test at 320px — no horizontal scroll, usable?
- [ ] Check color contrast — all text 4.5:1?
- [ ] Verify design tokens — no hardcoded values?
- [ ] Check component states — loading, empty, error?
- [ ] Test forms — labels, validation, error messages?
- [ ] Check motion — prefers-reduced-motion respected?
- [ ] Verify i18n — no hardcoded strings?
- [ ] Run Lighthouse — Core Web Vitals pass?
- [ ] Analyze bundle — size, duplicates, unused?
- [ ] Test screen reader — NVDA/VoiceOver?
- [ ] Check touch targets — 44×44px on mobile?