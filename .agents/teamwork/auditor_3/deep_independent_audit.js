const fs = require('fs');
const { execSync } = require('child_process');

const TARGET_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(TARGET_PATH, 'utf8');
const lines = content.split('\n');

console.log('================================================================');
console.log('AUDITOR 3: INDEPENDENT RIGOROUS RATIFICATION SUITE');
console.log(`Target: ${TARGET_PATH}`);
console.log(`Document Size: ${content.length} bytes, ${lines.length} lines`);
console.log('================================================================\n');

let failedAssertions = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    failedAssertions++;
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Track Completeness and Section Hierarchy (30 tracks, 210 sections)
// ---------------------------------------------------------------------------
console.log('--- TEST 1: TRACK & SECTION INTEGRITY ---');
const trackRegex = /#### 🔹 Track (\d+): ([^\n]+)/g;
let match;
const tracks = [];
while ((match = trackRegex.exec(content)) !== null) {
  tracks.push({ num: parseInt(match[1], 10), title: match[2].trim(), start: match.index });
}
assert(tracks.length === 30, `Found 30 tracks (actual: ${tracks.length})`);

const endOfTracksIdx = content.indexOf('## 3. Recommended Phased Execution Strategy');
assert(endOfTracksIdx !== -1, 'Found section 3 boundary');

let totalValidSections = 0;
for (let i = 0; i < tracks.length; i++) {
  const current = tracks[i];
  const nextStart = (i + 1 < tracks.length) ? tracks[i+1].start : endOfTracksIdx;
  const trackContent = content.slice(current.start, nextStart);
  current.content = trackContent;

  for (let s = 1; s <= 7; s++) {
    const secRegex = new RegExp(`#####\\s+${s}\\.\\s+`, 'm');
    const hasSec = secRegex.test(trackContent);
    if (hasSec) {
      totalValidSections++;
    } else {
      console.error(`Track ${current.num} missing section ${s}`);
    }
  }
}
assert(totalValidSections === 210, `All 210 subsections present (actual: ${totalValidSections}/210)`);

// ---------------------------------------------------------------------------
// TEST 2: UI States & Reduced Motion in ALL 30 Tracks (Section 5)
// ---------------------------------------------------------------------------
console.log('\n--- TEST 2: 4 UI STATES & REDUCED MOTION IN ALL 30 TRACKS ---');
let statesPassed = 0;
tracks.forEach(t => {
  const sec5Match = t.content.match(/##### 5\. UI \/ UX & Anti-Slop Specifications([\s\S]*?)##### 6\./);
  if (!sec5Match) {
    assert(false, `Track ${t.num} missing Section 5`);
    return;
  }
  const sec5 = sec5Match[1];
  
  const hasEmpty = /(`empty`|\*empty(\s*state)?\*|\bempty\s*:)/i.test(sec5);
  const hasLoading = /(`loading`|\*loading(\s*state)?\*|\bloading\s*:)/i.test(sec5);
  const hasError = /(`error`|\*error(\s*state)?\*|\berror\s*:)/i.test(sec5);
  const hasSuccess = /(`success`|\*success(\s*state)?\*|\bsuccess\s*:)/i.test(sec5);
  const hasMotion = /prefers-reduced-motion/i.test(sec5);

  const ok = hasEmpty && hasLoading && hasError && hasSuccess && hasMotion;
  if (ok) {
    statesPassed++;
  } else {
    console.error(`Track ${t.num} failed states: empty=${hasEmpty}, loading=${hasLoading}, error=${hasError}, success=${hasSuccess}, motion=${hasMotion}`);
  }
});
assert(statesPassed === 30, `All 30 tracks define canonical 4 UI states + reduced-motion (actual: ${statesPassed}/30)`);

// ---------------------------------------------------------------------------
// TEST 3: Track 21 Specific Deep Inspection
// ---------------------------------------------------------------------------
console.log('\n--- TEST 3: TRACK 21 VERIFICATION ---');
const t21 = tracks.find(t => t.num === 21);
assert(t21 !== undefined, 'Track 21 exists');
const t21Sec5 = t21.content.slice(t21.content.indexOf('##### 5.'), t21.content.indexOf('##### 6.'));
assert(t21Sec5.includes('- `empty`:'), 'Track 21 defines `empty` state');
assert(t21Sec5.includes('- `loading`:'), 'Track 21 defines `loading` state');
assert(t21Sec5.includes('- `error`:'), 'Track 21 defines `error` state');
assert(t21Sec5.includes('- `success`:'), 'Track 21 defines `success` state');
assert(t21Sec5.includes('prefers-reduced-motion: reduce'), 'Track 21 defines prefers-reduced-motion');

// ---------------------------------------------------------------------------
// TEST 4: Zero Cheating / Placeholder Elisions / TODOs / Facades
// ---------------------------------------------------------------------------
console.log('\n--- TEST 4: PLACEHOLDERS & CHEATING DETECTION ---');
const placeholderRegex = /\b(TODO|FIXME|TBD|STUB|XXX)\b/gi;
const placeholderMatches = content.match(placeholderRegex) || [];
assert(placeholderMatches.length === 0, `Zero TODO/FIXME/TBD/STUB/XXX markers in entire plan (count: ${placeholderMatches.length})`);

// Extract all code blocks
const tsBlocks = [];
const codeBlockRegex = /```(?:typescript|ts|javascript|js)?([\s\S]*?)```/g;
let cMatch;
while ((cMatch = codeBlockRegex.exec(content)) !== null) {
  tsBlocks.push(cMatch[1]);
}
console.log(`Total code blocks analyzed: ${tsBlocks.length}`);

let notImplementedCount = 0;
let stubBodyCount = 0;
tsBlocks.forEach((block, idx) => {
  if (/throw new (NotImplementedError|Error\(.*not implemented.*\))/i.test(block)) {
    notImplementedCount++;
  }
  if (/\{\s*\/\/\s*(TODO|FIXME|STUB|PLACEHOLDER)/i.test(block)) {
    stubBodyCount++;
  }
});
assert(notImplementedCount === 0, `Zero NotImplemented errors in code blocks (count: ${notImplementedCount})`);
assert(stubBodyCount === 0, `Zero stub comments in code block bodies (count: ${stubBodyCount})`);

// ---------------------------------------------------------------------------
// TEST 5: Zero Drizzle ORM Prohibition & 100% QlOrm Compliance
// ---------------------------------------------------------------------------
console.log('\n--- TEST 5: DRIZZLE PROHIBITION & QLORM COMPLIANCE ---');
const drizzleMatches = content.match(/\b(drizzle-orm|drizzle-kit|pgTable|mysqlTable|sqliteTable)\b/g) || [];
assert(drizzleMatches.length === 0, `Zero Drizzle ORM references in plan (actual: ${drizzleMatches.length})`);

const selectionKeyMatches = content.match(/selectionKeys\s*:\s*\[/g) || [];
assert(selectionKeyMatches.length === 0, `Zero selectionKeys references in plan (actual: ${selectionKeyMatches.length})`);

const optionsMatches = content.match(/options\s*:\s*\[/g) || [];
assert(optionsMatches.length >= 17, `Valid QlOrm options declarations present (count: ${optionsMatches.length})`);

// Count QlModelDefinition models
const modelDefs = content.match(/const\s+\w+\s*:\s*QlModelDefinition/g) || [];
console.log(`Explicit QlModelDefinition model instances defined: ${modelDefs.length}`);
assert(modelDefs.length >= 30, `Comprehensive QlModelDefinition instances defined across tracks (count: ${modelDefs.length})`);

// ---------------------------------------------------------------------------
// TEST 6: Boundary Compliance (MoonClient SDK, Zero raw fetch, Zero raw form controls)
// ---------------------------------------------------------------------------
console.log('\n--- TEST 6: BOUNDARY COMPLIANCE ---');
const gate2GitGrep = 'git grep -E "(fetch\\(|axios\\.|XMLHttpRequest)" -- "apps/web/src/**"';
const gate3GitGrep = 'git grep -E "(style=\\{\\{|#[0-9a-fA-F]{3,6})" -- "apps/web/src/**"';

assert(content.includes(gate2GitGrep), 'Gate 2 POSIX git grep command documented verbatim');
assert(content.includes(gate3GitGrep), 'Gate 3 POSIX git grep command documented verbatim');

try {
  execSync(gate2GitGrep, { stdio: 'pipe' });
  assert(false, 'Gate 2 should exit with 1 (zero matches)');
} catch (e) {
  assert(e.status === 1, `Gate 2 repository execution clean: exit code ${e.status} (zero matches)`);
}

try {
  execSync(gate3GitGrep, { stdio: 'pipe' });
  assert(false, 'Gate 3 should exit with 1 (zero matches)');
} catch (e) {
  assert(e.status === 1, `Gate 3 repository execution clean: exit code ${e.status} (zero matches)`);
}

// ---------------------------------------------------------------------------
// TEST 7: Git Repository Cleanliness (Tracked Files Unmodified)
// ---------------------------------------------------------------------------
console.log('\n--- TEST 7: REPOSITORY WORKSPACE INTEGRITY ---');
const gitDiff = execSync('git diff', { encoding: 'utf8' }).trim();
const gitCachedDiff = execSync('git diff --cached', { encoding: 'utf8' }).trim();
assert(gitDiff === '', 'Zero unstaged changes in tracked repository files');
assert(gitCachedDiff === '', 'Zero staged changes in tracked repository files');

// ---------------------------------------------------------------------------
// TEST 8: Pnpm Package Filter Selectors & Table 1.3 Dependency Order
// ---------------------------------------------------------------------------
console.log('\n--- TEST 8: PNPM PACKAGE FILTERS & DEPENDENCY ORDERING ---');
const brokenFilters = content.match(/pnpm\s+--filter\s+(apps\/web|packages\/ql_[a-z0-9_]+)/g) || [];
assert(brokenFilters.length === 0, `Zero broken pnpm directory filters in plan (count: ${brokenFilters.length})`);

const batchMap = {
  '26': 1, '01': 1, '1': 1, '02': 1, '2': 1, '23': 1, '27': 1,
  '04': 2, '4': 2, '05': 2, '5': 2, '08': 2, '8': 2, '09': 2, '9': 2, '22': 2,
  '06': 3, '6': 3, '07': 3, '7': 3, '10': 3, '03': 3, '3': 3,
  '11': 4, '12': 4, '13': 4, '14': 4, '15': 4,
  '16': 5, '17': 5, '18': 5, '19': 5, '20': 5,
  '21': 6, '24': 6, '25': 6, '28': 6, '29': 6, '30': 6
};
const table13 = content.slice(content.indexOf('### Table 1.3: Cross-Track Dependency Matrix'), content.indexOf('## 2. In-Depth Track Specifications'));
const rows = table13.split('\n').filter(r => r.includes('| Track '));
let inversions = 0;
rows.forEach(r => {
  const cols = r.split('|').map(c => c.trim()).filter(Boolean);
  if (cols.length >= 5) {
    const tNumMatch = cols[0].match(/Track\s+(\d+)/);
    if (!tNumMatch) return;
    const tNum = tNumMatch[1];
    const currBatch = batchMap[tNum];
    const upMatches = [...cols[3].matchAll(/Track\s+(\d+)/g)];
    upMatches.forEach(m => {
      const upNum = m[1];
      if (batchMap[upNum] > currBatch) {
        inversions++;
        console.error(`INVERSION: Track ${tNum} (Batch ${currBatch}) depends on upstream Track ${upNum} (Batch ${batchMap[upNum]})`);
      }
    });
  }
});
assert(inversions === 0, `Table 1.3 batch schedule inversions = 0 (actual: ${inversions})`);

// ---------------------------------------------------------------------------
// FINAL SUMMARY
// ---------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`AUDITOR 3 AUDIT FINISHED: ${failedAssertions === 0 ? 'ALL ASSERTIONS PASSED (CLEAN)' : `${failedAssertions} ASSERTIONS FAILED (INTEGRITY VIOLATION)`}`);
console.log('================================================================');
process.exit(failedAssertions === 0 ? 0 : 1);
