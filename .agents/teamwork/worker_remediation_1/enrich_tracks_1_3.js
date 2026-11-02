import fs from "node:fs";

const TARGET_PATH = "C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md";
let content = fs.readFileSync(TARGET_PATH, "utf8");

const TRACKS_1_3 = {
  1: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Dignified fallback placeholder (\`.ql-empty-state\`) displayed if passage payload contains zero ayah tokens.
  - \`loading\`: Skeleton text line (\`.ql-skeleton-pulse\`) with pre-computed bounding rect height matching selected scale tier, guaranteeing CLS = 0.
  - \`error\`: Inline error indicator with graceful fallback font cascade (\`KFGQPC Uthmanic\` -> \`Amiri Quran\` -> \`Scheherazade New\` -> \`serif\`) if web font assets fail to load.
  - \`success\`: Pristine sacred Arabic calligraphy rendering with vertical diacritical balance, kashida justification, and gold waqaf accents.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Font swap transitions and scale adjustment resizing tweens are completely bypassed; scale changes apply instantaneously without animation.`
  },
  2: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Standard \`@moonwitness/ui\` \`EmptyState\` with dignified explanation when translation edition is unavailable or passage is not found.
  - \`loading\`: Synchronized dual-column skeleton loader (\`.ql-skeleton-pulse\`) matching verse count with fixed row heights to eliminate layout shifting.
  - \`error\`: Actionable inline recovery banner (\`.ql-error-banner\`) with status code and retry button via \`Button\`.
  - \`success\`: Synchronized dual-stream layout with parallel verse alignment, active row highlighting, and proportional scroll tracking.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Smooth scroll interpolation is replaced with instant scroll jumps (0ms duration); row selection transitions apply immediately.`
  },
  3: {
    states: `- **Canonical 4 UI States**:
  - \`empty\`: Centered \`.ql-empty-state\` indicating no cross-surah connections recorded for concept query with suggestions for canonical themes (Musa, Creation, Patience).
  - \`loading\`: Geometric circular SVG skeleton with pulsing radial hairlines preserving graph canvas height (600px).
  - \`error\`: Actionable error boundary (\`.ql-error-banner\`) with "Failed to resolve semantic connections" and retry trigger.
  - \`success\`: Fully stabilized interactive SVG force-directed graph with thematic cross-surah nodes and accessible dual-view data table.`,
    motion: `- **Universal Reduced Motion (\`@media (prefers-reduced-motion: reduce)\`)**: Force simulation computes final node coordinates synchronously without animated simulation steps; zoom/pan transitions are instantaneous (0ms).`
  }
};

for (let trackNum = 1; trackNum <= 3; trackNum++) {
  const data = TRACKS_1_3[trackNum];
  const trackHeaderRegex = new RegExp(`(#### 🔹 Track ${String(trackNum).padStart(2, "0")}:[\\s\\S]*?##### 5\\. UI \\/ UX & Anti-Slop Specifications)([\\s\\S]*?)(##### 6\\. Phased Implementation Roadmap)`);
  const match = content.match(trackHeaderRegex);
  if (!match) {
    console.error(`Could not match Track ${trackNum}`);
    continue;
  }

  const [full, prefix, sec5Body, suffix] = match;
  let newSec5Body = sec5Body.trimEnd();

  // Remove old partial states block if present
  newSec5Body = newSec5Body.replace(/- \*\*(?:States|State Handling)\*\*:[\s\S]*?(?=- \*\*Accessibility|- \*\*Design Token|- \*\*Compliance|$)/, "");

  newSec5Body = `${newSec5Body}\n${data.states}\n${data.motion}\n\n`;

  content = content.replace(full, `${prefix}${newSec5Body}${suffix}`);
  console.log(`✓ Enriched Track ${String(trackNum).padStart(2, "0")}`);
}

fs.writeFileSync(TARGET_PATH, content, "utf8");
console.log("Updated file written. New length:", content.length);
