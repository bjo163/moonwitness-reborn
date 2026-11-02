const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ARTIFACT_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';

console.log('================================================================');
console.log('VICTORY AUDITOR: INDEPENDENT POST-VICTORY AUDIT SUITE');
console.log('Target Artifact:', ARTIFACT_PATH);
console.log('================================================================');

if (!fs.existsSync(ARTIFACT_PATH)) {
  console.error(`CRITICAL: Artifact not found at ${ARTIFACT_PATH}`);
  process.exit(1);
}

const content = fs.readFileSync(ARTIFACT_PATH, 'utf8');
const byteSize = Buffer.byteLength(content, 'utf8');
const lines = content.split('\n');
console.log(`Document Size: ${byteSize} bytes, ${lines.length} lines`);

let failedChecks = 0;
let passedChecks = 0;

function check(desc, condition, details = '') {
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${desc} ${details ? `(${details})` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// SUITE 1: STRUCTURE & 30-TRACK COVERAGE
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 1: 30-TRACK COVERAGE & HIERARCHY ---');

check('Artifact size >= 300 KB', byteSize >= 300000, `actual: ${byteSize}`);
check('Artifact lines >= 7,500', lines.length >= 7500, `actual: ${lines.length}`);

// Check 6 Grand Domains in Section 1.2
const domainPatterns = [
  /Group A:\s*Sacred Corpus/i,
  /Group B:\s*Cognitive AI/i,
  /Group C:\s*Spatial HUD/i,
  /Group D:\s*Harbor Community/i,
  /Group E:\s*Command Deck/i,
  /Group F:\s*Engineering Excellence/i
];
domainPatterns.forEach((p, idx) => {
  const groupLetter = String.fromCharCode(65 + idx);
  check(`Grand Domain Group ${groupLetter} present in Section 1.2`, p.test(content));
});

// Check all 30 Tracks in Section 2 (format: #### 🔹 Track 01: ...)
const trackRegex = /####\s*(?:🔹\s*)?Track\s+(\d{2}):\s*([^\n\r]+)/g;
const tracks = [];
let tMatch;
while ((tMatch = trackRegex.exec(content)) !== null) {
  tracks.push({ num: tMatch[1], title: tMatch[2].trim(), index: tMatch.index });
}
check('Found exactly 30 track headings in Section 2', tracks.length === 30, `actual: ${tracks.length}`);

// Verify track numbers 01 to 30 sequentially
let sequential = true;
for (let i = 0; i < 30; i++) {
  const expectedNum = String(i + 1).padStart(2, '0');
  if (!tracks[i] || tracks[i].num !== expectedNum) {
    sequential = false;
    console.error(`Track sequence mismatch at index ${i}: expected ${expectedNum}, got ${tracks[i]?.num}`);
  }
}
check('Tracks 01 through 30 are sequentially ordered without gaps', sequential);

// ---------------------------------------------------------------------------
// SUITE 2: 7 STANDARDIZED SUBSECTIONS PER TRACK (210 SUBSECTIONS)
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 2: 210 STANDARDIZED SUBSECTIONS ---');

const requiredSubsections = [
  /1\.\s*System Architecture & Interaction Flow/i,
  /2\.\s*Concrete TypeScript Component Interfaces \/ Signatures/i,
  /3\.\s*QlOrm Model Declarations & Field Constraints/i,
  /4\.\s*API Contracts & DTOs/i,
  /5\.\s*UI \/ UX & Anti-Slop Specifications/i,
  /6\.\s*Phased Implementation Roadmap/i,
  /7\.\s*Verification Rubrics & Acceptance Criteria/i
];

let totalSubsections = 0;
const missingSubsections = [];

const section3Index = content.indexOf('## 3. Recommended Phased Execution Strategy');
const section2Content = section3Index !== -1 ? content.slice(0, section3Index) : content;

for (let i = 0; i < tracks.length; i++) {
  const currentTrack = tracks[i];
  const nextTrackIndex = i < tracks.length - 1 ? tracks[i + 1].index : section3Index;
  const trackBody = section2Content.slice(currentTrack.index, nextTrackIndex);

  let trackSubs = 0;
  requiredSubsections.forEach((subRegex, subIdx) => {
    if (subRegex.test(trackBody)) {
      trackSubs++;
      totalSubsections++;
    } else {
      missingSubsections.push(`Track ${currentTrack.num} missing subsection ${subIdx + 1}`);
    }
  });
}

check('All 210 standardized subsections present across 30 tracks', totalSubsections === 210, `actual: ${totalSubsections}/210`);
if (missingSubsections.length > 0) {
  console.error('Missing subsections:', missingSubsections);
}

// ---------------------------------------------------------------------------
// SUITE 3: UI STATES & REDUCED MOTION (30/30)
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 3: CANONICAL 4 UI STATES & REDUCED MOTION ---');

const statesMissing = [];
for (let i = 0; i < tracks.length; i++) {
  const currentTrack = tracks[i];
  const nextTrackIndex = i < tracks.length - 1 ? tracks[i + 1].index : section3Index;
  const trackBody = section2Content.slice(currentTrack.index, nextTrackIndex);

  const hasEmpty = /`?empty`?:/i.test(trackBody);
  const hasLoading = /`?loading`?:/i.test(trackBody);
  const hasError = /`?error`?:/i.test(trackBody);
  const hasSuccess = /`?success`?:/i.test(trackBody);
  const hasReducedMotion = /(prefers-reduced-motion|reduced\s*motion)/i.test(trackBody);

  const missing = [];
  if (!hasEmpty) missing.push('empty');
  if (!hasLoading) missing.push('loading');
  if (!hasError) missing.push('error');
  if (!hasSuccess) missing.push('success');
  if (!hasReducedMotion) missing.push('reduced-motion');

  if (missing.length > 0) {
    statesMissing.push(`Track ${currentTrack.num} (${currentTrack.title}): missing ${missing.join(', ')}`);
  }
}

check('All 30 tracks define canonical 4 UI states + reduced-motion', statesMissing.length === 0, `missing in ${statesMissing.length} tracks`);
if (statesMissing.length > 0) {
  console.error('State omissions:', statesMissing);
}

// Verify Track 21 specifically (the previous Auditor 2 binary veto point)
const track21 = tracks.find(t => t.num === '21');
if (track21) {
  const t21Body = section2Content.slice(track21.index, tracks[21].index);
  check('Track 21 defines empty state', /`?empty`?:/i.test(t21Body));
  check('Track 21 defines loading state', /`?loading`?:/i.test(t21Body));
  check('Track 21 defines error state', /`?error`?:/i.test(t21Body));
  check('Track 21 defines success state', /`?success`?:/i.test(t21Body));
  check('Track 21 defines prefers-reduced-motion', /prefers-reduced-motion/i.test(t21Body));
}

// ---------------------------------------------------------------------------
// SUITE 4: INTEGRITY FORENSICS (CHEATING, FACADES, STUBS, TODOs)
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 4: INTEGRITY FORENSICS ---');

// Check for TODO/FIXME/TBD/STUB/XXX
const forbiddenWords = content.match(/\b(TODO|FIXME|TBD|STUB|XXX)\b/g) || [];
check('Zero forbidden elisions (TODO/FIXME/TBD/STUB/XXX)', forbiddenWords.length === 0, `count: ${forbiddenWords.length}`);

// Extract all TypeScript code blocks
const tsBlockRegex = /```typescript([\s\S]*?)```/g;
let bMatch;
let blockCount = 0;
let notImplementedCount = 0;
let emptyBodyCount = 0;

while ((bMatch = tsBlockRegex.exec(content)) !== null) {
  blockCount++;
  const code = bMatch[1];
  if (code.includes('NotImplementedError')) {
    notImplementedCount++;
  }
  // Check for dummy function bodies: function ... () { } or { return null; } without logic
  if (/function\s+\w+\s*\([^)]*\)\s*\{\s*(return(\s+null)?;\s*)?\}/.test(code)) {
    emptyBodyCount++;
  }
}

check(`TypeScript code blocks extracted (count: ${blockCount})`, blockCount >= 130);
check('Zero NotImplementedError exceptions in code blocks', notImplementedCount === 0, `count: ${notImplementedCount}`);
check('Zero dummy/empty function bodies in code blocks', emptyBodyCount === 0, `count: ${emptyBodyCount}`);

// ---------------------------------------------------------------------------
// SUITE 5: DRIZZLE ORM PROHIBITION & QLORM COMPLIANCE
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 5: ARCHITECTURAL COMPLIANCE (QLORM & DRIZZLE PROHIBITION) ---');

// Check for prohibited Drizzle imports and schemas
const drizzleImports = content.match(/import\s+.*?from\s+['"]drizzle-orm/gi) || [];
const drizzleTables = content.match(/\b(pgTable|mysqlTable|sqliteTable)\s*\(/g) || [];
check('Zero Drizzle ORM package imports in plan', drizzleImports.length === 0, `count: ${drizzleImports.length}`);
check('Zero Drizzle table declarations in plan', drizzleTables.length === 0, `count: ${drizzleTables.length}`);

// Check for forbidden selectionKeys (must use options: [...])
const selectionKeys = content.match(/selectionKeys\s*:/g) || [];
check('Zero selectionKeys occurrences (uses compliant options: readonly string[])', selectionKeys.length === 0, `count: ${selectionKeys.length}`);

// Check genuine QlModelDefinition occurrences
const qlModelOccurrences = content.match(/:\s*QlModelDefinition\b/g) || [];
check('Comprehensive QlModelDefinition instances declared (count >= 30)', qlModelOccurrences.length >= 30, `actual: ${qlModelOccurrences.length}`);

// ---------------------------------------------------------------------------
// SUITE 6: CLIENT SDK & UI BOUNDARIES
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 6: CLIENT SDK & UI BOUNDARY SPECIFICATIONS ---');

// Gate 2 regex: check web code in repo
let gate2Clean = false;
try {
  execSync('git grep -E "(fetch\\(|axios\\.|XMLHttpRequest)" -- "apps/web/src/**"', { stdio: 'pipe' });
} catch (err) {
  if (err.status === 1) gate2Clean = true;
}
check('Repository Gate 2: Zero raw HTTP clients in apps/web (exit code 1)', gate2Clean);

// Gate 3 regex: check web code in repo
let gate3Clean = false;
try {
  execSync('git grep -E "(style=\\{\\{|#[0-9a-fA-F]{3,6})" -- "apps/web/src/**"', { stdio: 'pipe' });
} catch (err) {
  if (err.status === 1) gate3Clean = true;
}
check('Repository Gate 3: Zero inline styles or raw hex colors in apps/web (exit code 1)', gate3Clean);

// Gate 1 regex: check Drizzle in repo
let drizzleClean = false;
try {
  execSync('git grep -i "drizzle" -- "packages/**" "apps/**" ":!*pnpm-lock.yaml"', { stdio: 'pipe' });
} catch (err) {
  if (err.status === 1) drizzleClean = true;
}
check('Repository Gate 1: Zero Drizzle references in packages/apps (exit code 1)', drizzleClean);

// ---------------------------------------------------------------------------
// SUITE 7: SECTION 3 EXECUTION BATCHES & DEPENDENCIES
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 7: SECTION 3 EXECUTION BATCHES & DEPENDENCIES ---');

const batchMap = {
  '26': 1, '01': 1, '1': 1, '02': 1, '2': 1, '23': 1, '27': 1,
  '04': 2, '4': 2, '05': 2, '5': 2, '08': 2, '8': 2, '09': 2, '9': 2, '22': 2,
  '06': 3, '6': 3, '07': 3, '7': 3, '10': 3, '03': 3, '3': 3,
  '11': 4, '12': 4, '13': 4, '14': 4, '15': 4,
  '16': 5, '17': 5, '18': 5, '19': 5, '20': 5,
  '21': 6, '24': 6, '25': 6, '28': 6, '29': 6, '30': 6
};

// Check all 6 execution batches
const mappedBatches = new Set(Object.values(batchMap));
check('All 6 sequential execution batches defined', mappedBatches.size === 6);

// Verify Section 1 Table 1.3 dependencies
const table13Index = content.indexOf('### 1.3 Master Cross-Domain Interaction & Dependency Matrix');
const table13End = content.indexOf('## 2. In-Depth Track Specifications');
let inversions = 0;

if (table13Index !== -1 && table13End !== -1) {
  const table13 = content.slice(table13Index, table13End);
  const rows = table13.split('\n').filter(r => r.includes('| **'));
  rows.forEach(r => {
    const cols = r.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 6) {
      const tNumMatch = cols[0].match(/\*\*(\d+)\*\*/);
      if (!tNumMatch) return;
      const tNum = tNumMatch[1];
      const currBatch = batchMap[tNum];
      const upMatches = [...cols[4].matchAll(/Track\s+(\d+)/g)];
      upMatches.forEach(m => {
        const upNum = m[1];
        if (batchMap[upNum] && batchMap[upNum] > currBatch) {
          inversions++;
          console.error(`INVERSION: Track ${tNum} (Batch ${currBatch}) depends on downstream Track ${upNum} (Batch ${batchMap[upNum]})`);
        }
      });
    }
  });
}

check('Zero cross-track dependency inversions in Section 1.3 matrix', inversions === 0, `inversions: ${inversions}`);

// Check broken pnpm filters
const brokenFilters = content.match(/pnpm\s+--filter\s+(apps\/web|packages\/ql_[a-z0-9_]+)/g) || [];
check('Zero broken directory-based pnpm filters in commands', brokenFilters.length === 0, `count: ${brokenFilters.length}`);

// ---------------------------------------------------------------------------
// SUITE 8: SECTION 4 STRATEGIC DECISION GATES & CI PIPELINE
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 8: SECTION 4 STRATEGIC DECISION GATES & CI PIPELINE ---');

const gatePatterns = [
  /Gate 1:\s*Sovereign Data Model/i,
  /Gate 2:\s*Client SDK & Network Boundary/i,
  /Gate 3:\s*UI Composite.*Anti-Slop/i,
  /Gate 4:\s*Web Bundle Budget/i,
  /Gate 5:\s*Epistemic Rigor.*Sanad/i
];

let gatesFound = 0;
gatePatterns.forEach((gp, idx) => {
  if (gp.test(content)) {
    gatesFound++;
  } else {
    console.error(`Missing Architectural Compliance Gate ${idx + 1}`);
  }
});
check('All 5 Master Architectural Compliance Gates specified in Section 4.1', gatesFound === 5, `actual: ${gatesFound}/5`);

// Check Section 4.2 CI/CD Verification Suite
const ciCommands = [
  /pnpm\s+typecheck/,
  /pnpm\s+lint/,
  /pnpm\s+i18n:sync:check/,
  /pnpm\s+test/,
  /pnpm\s+--filter\s+@moonwitness\/ql_workflow\s+test/,
  /pnpm\s+--filter\s+@moonwitness\/web\s+size/,
  /pnpm\s+--filter\s+@moonwitness\/web\s+test:e2e/
];

let ciPassed = 0;
ciCommands.forEach(cmd => {
  if (cmd.test(content)) ciPassed++;
});
check('Section 4.2 CI/CD pipeline contains all 7 canonical automated verification gates', ciPassed === 7, `actual: ${ciPassed}/7`);

// Check Section 4.3 Release Readiness Checklist
const hasChecklist = /### 4.3 Release Readiness & User Review Checklist/i.test(content);
check('Section 4.3 Release Readiness & User Review Checklist present', hasChecklist);

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`VICTORY AUDIT TEST RESULTS: ${passedChecks} PASSED, ${failedChecks} FAILED`);
console.log(`VERDICT: ${failedChecks === 0 ? 'VICTORY CONFIRMED' : 'VICTORY REJECTED'}`);
console.log('================================================================');

process.exit(failedChecks === 0 ? 0 : 1);
