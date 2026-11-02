const fs = require('fs');
const { execSync } = require('child_process');

const TARGET_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(TARGET_PATH, 'utf8');

// Target chunk (lines 5529-5532)
const targetContent = `- **UI States**:
  - *Empty State*: Displays \`@moonwitness/ui\` \`EmptyState\` component with message "No telemetry metrics collected yet. Server probe initializing."
  - *Loading State*: Skeleton cards with \`.ql-skeleton\` subtle pulse on sparkline rectangles.
  - *Error State*: Shows \`@moonwitness/ui\` \`Alert\` banner with reconnect button calling \`refreshNow()\`.`;

// Option 1: Surgical replacement of lines 5529-5532
const replacementContentOption1 = `- **Canonical 4 UI States**:
  - \`empty\`: Standard \`@moonwitness/ui\` \`EmptyState\` displaying "No telemetry metrics collected yet. Server probe initializing."
  - \`loading\`: Metric card skeletons with \`.ql-skeleton\` subtle pulse on sparkline rectangles preserving grid geometry (CLS = 0).
  - \`error\`: Actionable \`@moonwitness/ui\` \`Alert\` banner with status code and reconnect trigger calling \`refreshNow()\`.
  - \`success\`: Live operational telemetry HUD displaying real-time latency, Cloudflare edge health, and SVG sparkline streams.
- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Sparkline animation drawing tweens and status transitions are disabled; telemetry cards and threshold bars update instantaneously without animation.`;

// Option 2: Reordering so Accessibility comes before Canonical 4 UI States (lines 5529-5536)
const targetContentOption2 = `- **UI States**:
  - *Empty State*: Displays \`@moonwitness/ui\` \`EmptyState\` component with message "No telemetry metrics collected yet. Server probe initializing."
  - *Loading State*: Skeleton cards with \`.ql-skeleton\` subtle pulse on sparkline rectangles.
  - *Error State*: Shows \`@moonwitness/ui\` \`Alert\` banner with reconnect button calling \`refreshNow()\`.
- **Accessibility (WCAG 2.2 AA)**:
  - Contrast ratio of \`text-ink\` on \`bg-panel\` is >= 11:1.
  - Live announcements on status change using \`aria-live="polite"\` so screen readers announce transitions (e.g., "Telemetry status shifted to degraded: API latency 920 milliseconds").
  - Each sparkline SVG provides \`<title id="spark-title-{metricKey}">\` and \`aria-labelledby\`.`;

const replacementContentOption2 = `- **Accessibility (WCAG 2.2 AA)**:
  - Contrast ratio of \`text-ink\` on \`bg-panel\` is >= 11:1.
  - Live announcements on status change using \`aria-live="polite"\` so screen readers announce transitions (e.g., "Telemetry status shifted to degraded: API latency 920 milliseconds").
  - Each sparkline SVG provides \`<title id="spark-title-{metricKey}">\` and \`aria-labelledby\`.
- **Canonical 4 UI States**:
  - \`empty\`: Standard \`@moonwitness/ui\` \`EmptyState\` displaying "No telemetry metrics collected yet. Server probe initializing."
  - \`loading\`: Metric card skeletons with \`.ql-skeleton\` subtle pulse on sparkline rectangles preserving grid geometry (CLS = 0).
  - \`error\`: Actionable \`@moonwitness/ui\` \`Alert\` banner with status code and reconnect trigger calling \`refreshNow()\`.
  - \`success\`: Live operational telemetry HUD displaying real-time latency, Cloudflare edge health, and SVG sparkline streams.
- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Sparkline animation drawing tweens and status transitions are disabled; telemetry cards and threshold bars update instantaneously without animation.`;

function evaluatePlan(text, label) {
  console.log(`\n================ EVALUATING ${label} ================`);
  const tracks = text.split(/#### 🔹 Track (\d+):/);
  let nonCompliantTracks = [];
  for (let i = 1; i < tracks.length; i += 2) {
    const tNum = tracks[i].padStart(2, '0');
    const tContent = tracks[i + 1];
    const sec5Match = tContent.match(/##### 5\. UI \/ UX & Anti-Slop Specifications([\s\S]*?)##### 6\./);
    if (!sec5Match) {
      nonCompliantTracks.push({ tNum, reason: 'Section 5 not found' });
      continue;
    }
    const sec5 = sec5Match[1];
    const hasEmpty = /(`empty`|\*empty(\s*state)?\*|\bempty\s*:)/i.test(sec5);
    const hasLoading = /(`loading`|\*loading(\s*state)?\*|\bloading\s*:)/i.test(sec5);
    const hasError = /(`error`|\*error(\s*state)?\*|\berror\s*:)/i.test(sec5);
    const hasSuccess = /(`success`|\*success(\s*state)?\*|\bsuccess\s*:)/i.test(sec5);
    const hasMotion = /prefers-reduced-motion/i.test(sec5);

    if (!hasEmpty || !hasLoading || !hasError || !hasSuccess || !hasMotion) {
      nonCompliantTracks.push({ tNum, empty: hasEmpty, loading: hasLoading, error: hasError, success: hasSuccess, motion: hasMotion });
    }
  }

  console.log(`Total Tracks: ${(tracks.length - 1) / 2}`);
  console.log(`Compliant Tracks: ${30 - nonCompliantTracks.length} / 30`);
  if (nonCompliantTracks.length === 0) {
    console.log(`Result: 100% PASS for ${label}!`);
  } else {
    console.log(`Result: FAIL for ${label}`, nonCompliantTracks);
  }
}

evaluatePlan(content.replace(targetContent, replacementContentOption1), 'OPTION 1 (SURGICAL 5529-5532)');
evaluatePlan(content.replace(targetContentOption2, replacementContentOption2), 'OPTION 2 (CANONICAL ORDER 5529-5536)');
