const fs = require('fs');

const filePath = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
let content = fs.readFileSync(filePath, 'utf8');

const target = `- **UI States**:
  - *Empty State*: Displays \`@moonwitness/ui\` \`EmptyState\` component with message "No telemetry metrics collected yet. Server probe initializing."
  - *Loading State*: Skeleton cards with \`.ql-skeleton\` subtle pulse on sparkline rectangles.
  - *Error State*: Shows \`@moonwitness/ui\` \`Alert\` banner with reconnect button calling \`refreshNow()\`.`;

const replacement = `- **Canonical 4 UI States**:
  - \`empty\`: Standard \`@moonwitness/ui\` \`EmptyState\` displaying "No telemetry metrics collected yet. Server probe initializing."
  - \`loading\`: Metric card skeletons with \`.ql-skeleton\` subtle pulse on sparkline rectangles preserving grid geometry (CLS = 0).
  - \`error\`: Actionable \`@moonwitness/ui\` \`Alert\` banner with status code and reconnect trigger calling \`refreshNow()\`.
  - \`success\`: Live operational telemetry HUD displaying real-time latency, Cloudflare edge health, and SVG sparkline streams.
- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Sparkline animation drawing tweens and status transitions are disabled; telemetry cards and threshold bars update instantaneously without animation.`;

if (!content.includes(target)) {
  console.error("ERROR: Target content not found in file!");
  process.exit(1);
}

const occurrences = content.split(target).length - 1;
if (occurrences !== 1) {
  console.error(`ERROR: Expected 1 occurrence, found ${occurrences}!`);
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESS: Replaced target content with replacement successfully.");
