# UI/UX Architecture Reference

## UI/UX Architecture Principles

### 1. Design System Integration

**Design Tokens (Single Source of Truth):**
```typescript
// tokens/colors.ts
export const colors = {
  primary: { 50: '#...', 100: '#...', ..., 900: '#...' },
  semantic: {
    success: { light: '#...', main: '#...', dark: '#...' },
    warning: { light: '#...', main: '#...', dark: '#...' },
    error: { light: '#...', main: '#...', dark: '#...' },
    info: { light: '#...', main: '#...', dark: '#...' },
  },
  neutral: { 0: '#fff', 50: '#...', ..., 900: '#000' },
};

// tokens/spacing.ts
export const spacing = { 0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px' };

// tokens/typography.ts
export const typography = {
  fontFamilies: { sans: 'Inter, system-ui', mono: 'JetBrains Mono, monospace' },
  fontSizes: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px', '2xl': '24px', '3xl': '30px', '4xl': '36px' },
  fontWeights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
};
```

**Component Library Structure:**
```
packages/ql_ui/
├── src/
│   ├── primitives/        # Button, Input, Select, Checkbox, Radio, Avatar, Badge, Tooltip
│   ├── composites/        # Card, Modal, Dropdown, Table, Tabs, Accordion, Form, Navigation
│   ├── layouts/           # Container, Grid, Stack, Flex, Section, Page
│   ├── providers/         # ThemeProvider, TooltipProvider, PortalProvider
│   ├── hooks/             # useMediaQuery, useTheme, useDisclosure, useForm
│   ├── utils/             # cn, formatters, validators
│   └── index.ts           # Public API
├── tokens/                # Design tokens (source of truth)
└── themes/                # Theme configurations
```

### 2. Information Architecture

**Navigation Model:**
- **Global:** Primary navigation (persistent)
- **Contextual:** Secondary navigation (per section)
- **Local:** In-page navigation (tabs, breadcrumbs)
- **Utility:** User menu, settings, help

**Page Types:**
| Type | Purpose | Template |
|------|---------|----------|
| **Dashboard** | Overview, metrics, quick actions | Grid + widgets |
| **List/Index** | Browse, filter, sort, paginate | Table or card grid |
| **Detail** | Single entity view, actions | Header + sections |
| **Form/Create/Edit** | Data input, validation | Stepper or single page |
| **Settings** | Configuration, preferences | Categorized sections |
| **Auth** | Login, register, password reset | Centered card |
| **Error** | 404, 500, maintenance | Friendly, actionable |

### 3. Component Architecture

**Component Classification:**
| Category | Examples | Reusability |
|----------|----------|-------------|
| **Primitive** | Button, Input, Icon | High (everywhere) |
| **Composite** | Card, Modal, Table | High (configured) |
| **Feature** | UserProfileCard, BillingHistory | Medium (domain-specific) |
| **Page Section** | Hero, PricingTable, Footer | Low (page-specific) |

**Component API Design:**
```typescript
// Good: Composition over configuration
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Content</Card.Content>
  <Card.Footer><Button>Action</Button></Card.Footer>
</Card>

// Avoid: Prop explosion
<Card title="Title" content="Content" footer={<Button>Action</Button>} 
     headerClassName="" contentClassName="" footerClassName="" 
     onHeaderClick={} onContentHover={} ... />
```

**State Management:**
| State Type | Solution |
|------------|----------|
| **Server State** | TanStack Query / SWR (caching, sync) |
| **Client UI State** | React Context + useReducer / Zustand / Jotai |
| **Form State** | React Hook Form + Zod |
| **URL State** | Router (search params, path params) |
| **Global App State** | Minimal, prefer server state |

### 4. Accessibility (WCAG 2.1 AA) - Mandatory

**Required for Every Component:**
- Semantic HTML (`<button>`, `<a href>`, `<nav>`, `<main>`, `<header>`, `<footer>`)
- Focus management (visible focus, logical tab order, focus trap in modals)
- ARIA: labels, roles, states, live regions
- Color contrast: 4.5:1 (normal), 3:1 (large text, UI components)
- Keyboard: All interactive elements reachable and operable
- Screen reader: Tested with NVDA/VoiceOver
- Reduced motion: `prefers-reduced-motion` respected

**Testing Checklist:**
- [ ] Tab through entire page — focus visible, logical order
- [ ] Screen reader announces all content correctly
- [ ] Color contrast passes (axe, WAVE)
- [ ] Zoom 200% — no horizontal scroll, content readable
- [ ] All interactive elements have accessible names
- [ ] Form fields have associated labels
- [ ] Error messages announced, linked to fields
- [ ] Modals trap focus, close on Escape
- [ ] Skip links for main content

### 5. Responsive Design

**Breakpoints:**
| Name | Min Width | Target |
|------|-----------|--------|
| `xs` | 320px | Mobile |
| `sm` | 640px | Large mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

**Approach:** Mobile-first, progressive enhancement
- Base styles for mobile
- Media queries for larger screens
- Container queries for component-level responsiveness

**Touch Targets:** Minimum 44×44px (48×48px preferred)

### 6. UI States (Every Data-Displaying Component)

| State | Implementation |
|-------|----------------|
| **Loading** | Skeleton (preferred), spinner, progress — never blank |
| **Empty** | Illustrative, actionable CTA (e.g., "Create first item") — never blank |
| **Error** | Inline (field), Toast (action), Page (full) — specific message, retry action |
| **Partial** | Streaming, progressive loading — show what's ready |
| **Success** | Toast, inline confirmation, navigation — clear next step |

### 7. Forms & Validation

**Form Architecture:**
- React Hook Form + Zod schema
- Server-side validation mirrored on client
- Field-level validation on blur/change
- Form-level validation on submit
- Accessible error messages (linked via `aria-describedby`)

**Validation UX:**
- Show error after interaction (blur), not on mount
- Clear error on correction
- Disable submit during submission
- Show loading state during submission
- Success: toast + navigate or reset form

### 8. Internationalization (i18n)

**Architecture:**
- All user-facing strings in translation files
- ICU MessageFormat for pluralization, interpolation
- `Intl` APIs for dates, numbers, currencies
- RTL support: logical CSS properties (`margin-inline-start`), `dir` attribute
- Font fallbacks for CJK, Arabic scripts
- Locale detection: URL > header > browser > default

**File Structure:**
```
locales/
├── en.json
├── id.json
├── zh.json
└── es.json
```

### 9. Performance (Frontend)

**Core Web Vitals Targets:**
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5-4s | > 4s |
| INP | ≤ 200ms | 200-500ms | > 500ms |
| CLS | ≤ 0.1 | 0.1-0.25 | > 0.25 |

**Optimization Strategies:**
- Code splitting: Route-level + component-level
- Lazy loading: Images (`loading="lazy"`), components (`React.lazy`)
- Virtualization: Lists > 50 items (`@tanstack/react-virtual`)
- Memoization: `React.memo`, `useMemo`, `useCallback` (measure first)
- Bundle analysis: `webpack-bundle-analyzer`, `vite-bundle-analyzer`
- Critical CSS inlined, non-critical async
- Fonts: Subset, `font-display: swap`, preload critical
- Images: WebP/AVIF, responsive `srcset`, `width`/`height`

### 10. Animation & Motion

**Principles:**
- Purposeful: guides attention, explains relationships
- Performant: 60fps, `transform`/`opacity` only, `will-change`
- Respectful: `prefers-reduced-motion: reduce` honored
- Duration: < 200ms simple, < 500ms complex
- Easing: `ease-out` enter, `ease-in` exit

**Implementation:**
- CSS transitions for simple state changes
- Framer Motion for complex orchestration
- Spring animations for natural feel
- Staggered entrance for lists

### UI/UX Architecture Checklist

- [ ] Design tokens defined and used exclusively
- [ ] Component library covers primitives + composites
- [ ] Information architecture mapped (nav, page types)
- [ ] Component API uses composition over configuration
- [ ] State management strategy defined per state type
- [ ] Accessibility: WCAG 2.1 AA mandatory for all components
- [ ] Responsive: Mobile-first, breakpoints defined, touch targets
- [ ] UI states: Loading, empty, error, partial, success for all data components
- [ ] Forms: RHF + Zod, accessible validation, server-mirrored
- [ ] i18n: All strings externalized, ICU format, RTL ready
- [ ] Performance: Core Web Vitals targets, optimization strategies
- [ ] Motion: Purposeful, performant, respects reduced motion
- [ ] Design direction: MoonWitness aesthetic respected (if applicable)