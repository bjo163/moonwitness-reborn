import fs from "node:fs";

const TARGET_PATH = "C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md";
let content = fs.readFileSync(TARGET_PATH, "utf8");

// Map of custom definitions for tracks 4 through 30:
const TRACK_DATA = {
  4: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Neutral placeholder badge indicating verse seal has not been generated.
  - \`loading\`: Subtle hairline shimmer across seal badge during SHA-256 calculation (<5ms).
  - \`error\`: Warning badge (\`.ql-seal-mismatch\`) indicating cryptographic mismatch against canonical corpus passage.
  - \`success\`: Verified green/gold seal badge (\`.ql-seal-badge.is-verified\`) with copyable proof digest and QR verification preview.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Verification badge transitions appear immediately without pulse or scale effects.`
  },
  5: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Audio player displays disabled state with explanation when no audio recitation is available for selected surah.
  - \`loading\`: Static hairline waveform skeleton while audio buffer is being fetched and decoded.
  - \`error\`: Error banner (\`.ql-audio-error\`) with fallback reciter selector and retry trigger.
  - \`success\`: Active whispering audio waveform canvas reflecting real-time playback with millisecond-accurate verse highlighting.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Dynamic audio waveform canvas animation is replaced with a static volume bar; verse highlight changes instantly without fade.`
  },
  6: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Chat window empty state displaying dignified theological inquiry prompts.
  - \`loading\`: Typing indicator with subtle 3-dot pulse in \`--color-muted\` within layout-preserving message container.
  - \`error\`: Message delivery failure indicator with offline retry action.
  - \`success\`: Rendered chat message with interactive verified citation chips (\`.ql-citation-chip.is-grounded\`) and sliding-window quotation validation.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Typing dot animation and citation slide-over transitions are instantaneous (0ms).`
  },
  7: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Telemetry dock empty state when no failover events have occurred in the current session.
  - \`loading\`: Subtle hairline shimmer on provider telemetry badge during gateway health ping.
  - \`error\`: Telemetry alert banner indicating all upstream inference providers are circuit-broken, displaying \`ProviderMeshFallbackDto\`.
  - \`success\`: Clean \`.ql-mesh-badge--healthy\` indicator displaying active provider code, latency, and circuit status.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Status badge color transitions and pulse indicators switch immediately with 0ms delay.`
  },
  8: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Suggestion chips (\`.ql-root-chip\`) for high-frequency Quranic roots (\`ر-ح-م\`, \`ع-ل-م\`, \`ق-و-ل\`) when input is blank.
  - \`loading\`: Morphological card skeletons preserving layout height.
  - \`error\`: Search error banner (\`.ql-search-error\`) with suggested root spelling corrections.
  - \`success\`: Tabulated root derivations, occurrence counts, and lemma breakdowns linked to Quranic verses.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Filter transitions and accordion expansions open immediately without slide animation.`
  },
  9: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Prompt to select an ayah word token to view its syntactic dependency tree.
  - \`loading\`: Skeleton dependency tree layout with placeholder geometric nodes.
  - \`error\`: Parsing error message indicating I'rab grammar data is unavailable for the selected token.
  - \`success\`: Pristine SVG grammatical dependency tree with color-coded syntax roles (I'rab) and part-of-speech tags.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: SVG tree node expansions and connector line drawing animations render instantly.`
  },
  10: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Model download prompt with memory footprint estimate (\`Approx. 35 MB\`) before first local inference run.
  - \`loading\`: Accessible progress bar (\`role="progressbar"\`) displaying deterministic weight download percentage.
  - \`error\`: Graceful degradation banner with option to switch to WASM or server-side inference if WebGPU adapter is unavailable.
  - \`success\`: Privacy badge (\`.ql-privacy-badge\`) confirming zero-egress local execution with sub-45ms embedding match.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Download progress fill updates without ease transition; privacy shield icon displays statically without shimmer.`
  },
  11: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Static neutral gradient background when canvas is unmounted or in test mode.
  - \`loading\`: Deep space dark void canvas initialized immediately with zero visual pop-in.
  - \`error\`: Fallback to static CSS gradient background if WebGL/Canvas context creation fails.
  - \`success\`: Serene 60 FPS HTML5 canvas particle simulation consuming <1% CPU; auto-pauses when tab is hidden or \`?disable-particles=true\` is set.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Particle render loop is completely stopped; renders a static, motionless parchment or void backdrop.`
  },
  12: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Minimalist orbital ring guide with region markers when no region is selected.
  - \`loading\`: Geometry skeleton rendering orbital ring path while telemetry data resolves.
  - \`error\`: Static 2D navigation list fallback if SVG coordinate transformation fails.
  - \`success\`: Parametric SVG orbital ring rendering 5 Command Center regions with smooth hover elevation and telemetry stats.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: 350ms orbital rotation transitions are replaced with instantaneous region jumps (0ms).`
  },
  13: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Audio toggle in muted state with visual tooltip indicating chime feedback is disabled.
  - \`loading\`: Muted state while Web Audio context initializes on first user interaction.
  - \`error\`: Silent visual fallback when browser audio policy blocks AudioContext creation.
  - \`success\`: Synthesized 432 Hz / 528 Hz pure sine chime with instant micro-haptic visual ring.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Visual chime ring expansion is disabled; micro-chime feedback remains purely auditory.`
  },
  14: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Not applicable; Zen stage displays centered Quranic revelation directly.
  - \`loading\`: Pitch-black canvas \`#070918\` held with zero chrome flash while scripture resolves.
  - \`error\`: Minimalist centered error message with keyboard shortcut \`Escape\` to return to HUD.
  - \`success\`: Pristine scripture text centered on pitch-black void with hidden chrome and accessible exit triggers (Escape key, desktop mouse reveal, mobile two-finger tap / floating pill).`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: 300ms fade transition on entry/exit is replaced with instant switch (0ms).`
  },
  15: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Fallback default layout container when container query measurement is uninitialized.
  - \`loading\`: Responsive grid skeleton matching detected viewport density tier.
  - \`error\`: Default CSS Grid fallback layout if container query polyfill fails.
  - \`success\`: Pixel-perfect responsive reflow across compact, standard, dense, and ultrawide density tiers.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Layout density changes reflow instantly without width/padding transition animations.`
  },
  16: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Informational prompt inviting contributor to read ethics oaths before signing.
  - \`loading\`: Signing button in loading state with spinning hairline indicator during Web Crypto key generation.
  - \`error\`: Signature verification error banner with cryptographic diagnostics and retry action.
  - \`success\`: Universally readable public ledger of verified covenant signatories with cryptographic proof digest.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Modal transitions and signature confirmation animations execute instantly without fade.`
  },
  17: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Study circle empty queue message when no peer reviews are pending evaluation.
  - \`loading\`: Task review card skeleton loader matching change request payload dimensions.
  - \`error\`: Quorum error banner indicating self-approval rejection or insufficient verifiers.
  - \`success\`: Multi-peer review card displaying independent scholar signatures, quorum progress, and approved status.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Quorum progress bar and status transitions update instantaneously.`
  },
  18: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Discovery empty state \`.ql-empty-state\` indicating no active study circles match filter, with "Create Circle" trigger.
  - \`loading\`: Study circle card grid skeleton loader preserving card layout dimensions.
  - \`error\`: Network error alert with offline cached circles list fallback.
  - \`success\`: Interactive study circle card grid showing active member counts, surah focus, and approved reflections.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Card hover elevations and tab switches occur instantaneously with 0ms transition.`
  },
  19: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Dignified message indicating no recent deeds recorded in the current timeframe.
  - \`loading\`: Chronological ledger row skeletons preserving table geometry.
  - \`error\`: Ledger query error banner with offline cached records fallback.
  - \`success\`: Universally readable public activity ledger of verified deeds with cryptographic proof hashes.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Ledger row insertions appear statically without slide-in animations.`
  },
  20: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Pre-publication dialog with unchecked ethical affirmation clauses.
  - \`loading\`: Submission verification state with disabled checkboxes during sanad validation.
  - \`error\`: Validation alert banner highlighting unchecked mandatory disclaimers.
  - \`success\`: Confirmation card confirming ethics clauses accepted and publishing content.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Dialog modal entry and checkbox checkmarks toggle instantly without animation.`
  },
  21: {
    // Already has states & motion, omit
  },
  22: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Clean state message indicating 100% key parity between \`id.po\` and \`en.po\` with 0 missing strings.
  - \`loading\`: Terminal/CLI progress indicator during GNU gettext AST parsing.
  - \`error\`: Parity failure report listing missing keys, untranslated msgids, and file line numbers.
  - \`success\`: Synchronized PO catalog summary showing total entries, fuzzy count, and parity percentage (100%).`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Telemetry dashboard widgets render static numbers without count-up animation.`
  },
  23: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Palette empty state \`.ql-spotlight-empty\` when fuzzy query matches 0 actions or verses, with suggested queries.
  - \`loading\`: Subtle hairline pulse along palette header during async ayah search.
  - \`error\`: Action execution error notice inside palette footer with recovery suggestion.
  - \`success\`: Categorized action list with keyboard-navigable highlighted results (\`.is-selected\`).`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Palette open/close transition drops to 0ms; selection highlight moves instantly without spring tween.`
  },
  24: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Format selection dialog awaiting user choice of PDF, Markdown, or JSON export.
  - \`loading\`: Deterministic progress bar (\`.ql-download-progress\`) with byte estimate while export blob generates.
  - \`error\`: Export failure banner with status code and downloadable error log.
  - \`success\`: Direct binary download initiation via \`downloadBlob()\` and SHA-256 seal verification badge.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Progress bar updates discretely; format card selection transitions have 0ms delay.`
  },
  25: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Offline cache manager empty state indicating no custom offline surahs selected.
  - \`loading\`: Cache sync progress indicator while precaching core mushaf assets.
  - \`error\`: Storage quota exceeded warning banner with cache cleanup options.
  - \`success\`: Offline indicator badge (\`.ql-offline-badge.is-cached\`) confirming instant offline availability.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Offline status badge transitions appear statically without pulse or glow.`
  },
  26: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Fallback movement container when specific movement section has no active content.
  - \`loading\`: Movement skeleton loader maintaining viewport height to ensure CLS = 0.
  - \`error\`: Isolated movement error boundary preventing failure in one movement from breaking the whole page.
  - \`success\`: Seamless sequential rendering of all 5 movements (Header, Corpus Hero, Spotlight, Harbor, Telemetry).`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Movement scroll-snapping and entrance fades are disabled; sections render statically.`
  },
  27: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Clean report state indicating 0 TypeScript errors and 0 ESLint warnings.
  - \`loading\`: Typecheck and lint runner progress indicator.
  - \`error\`: Formatted compiler diagnostic report with file, line, and strict error code.
  - \`success\`: Ratified zero-warning compilation report across all packages and apps.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Dashboard metric indicators display final counts without animation.`
  },
  28: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Budget monitor empty state before build artifacts are generated.
  - \`loading\`: Bundle analyzer progress tracker during Next.js production build.
  - \`error\`: CI budget violation alert banner indicating route exceeded 140 kB First Load JS cap.
  - \`success\`: Green budget status report verifying all routes strictly <= 140 kB (main page <= 138 kB).`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Budget bar graphs render statically without animated bar fill.`
  },
  29: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Test runner initial state before permutation matrix execution.
  - \`loading\`: Permutation test execution progress indicator across transition graph.
  - \`error\`: State machine transition violation report detailing illegal state jump attempt.
  - \`success\`: Mathematical verification certificate proving 100% valid state transitions and zero security leaks.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Test runner progress counters update statically without animation.`
  },
  30: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Test matrix initial state before test run initiation.
  - \`loading\`: Playwright browser test runner execution status across Chromium, Firefox, WebKit.
  - \`error\`: Visual regression diff report highlighting pixels exceeding 1% tolerance threshold.
  - \`success\`: 100% green Playwright test summary verifying multi-breakpoint visual fidelity and user journeys.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: All visual regression tests explicitly configure \`prefers-reduced-motion: reduce\` and \`?disable-particles=true\` to eliminate flakiness in golden snapshot assertions.`
  }
};

let modifiedCount = 0;

for (let trackNum = 4; trackNum <= 30; trackNum++) {
  const data = TRACK_DATA[trackNum];
  if (!data || !data.states) continue;

  const trackHeaderRegex = new RegExp(`(#### 🔹 Track ${String(trackNum).padStart(2, "0")}:[\\s\\S]*?##### 5\\. UI \\/ UX & Anti-Slop Specifications)([\\s\\S]*?)(##### 6\\. Phased Implementation Roadmap)`);
  const match = content.match(trackHeaderRegex);
  if (!match) {
    console.error(`Could not match Track ${trackNum}`);
    continue;
  }

  const [full, prefix, sec5Body, suffix] = match;

  // If already has states or motion, check and replace or clean up existing partial states
  let newSec5Body = sec5Body.trimEnd();

  // Remove any old partial states block if present (e.g. in track 8, 21, 23)
  newSec5Body = newSec5Body.replace(/- \*\*States\*\*:[\s\S]*?(?=- \*\*Accessibility|- \*\*Design Token|- \*\*Compliance|$)/, "");

  // Append canonical 4 UI states and reduced motion before the next section
  newSec5Body = `${newSec5Body}\n${data.states}\n${data.motion}\n\n`;

  content = content.replace(full, `${prefix}${newSec5Body}${suffix}`);
  modifiedCount++;
  console.log(`✓ Enriched Track ${String(trackNum).padStart(2, "0")}`);
}

console.log(`Enriched ${modifiedCount} tracks.`);
fs.writeFileSync(TARGET_PATH, content, "utf8");
console.log("Updated file written. New length:", content.length);
