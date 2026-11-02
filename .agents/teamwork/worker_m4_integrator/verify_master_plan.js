const fs = require('fs');

const targetPath = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';

console.log('--- COMPREHENSIVE INTEGRITY & QUALITY AUDIT ---');
if (!fs.existsSync(targetPath)) {
  console.error('FAIL: Target artifact does not exist at ' + targetPath);
  process.exit(1);
}

const content = fs.readFileSync(targetPath, 'utf8');
const lines = content.split('\n');

console.log('Artifact Path:', targetPath);
console.log('File Size:', (content.length / 1024).toFixed(2), 'KB (' + content.length + ' bytes)');
console.log('Line Count:', lines.length, 'lines');

// 1. Check Section 0 to 4
const expectedSections = [
  '## 0. Executive Vision & Foundational Directives',
  '## 1. The 30 Master Strategic Tracks Matrix',
  '## 2. In-Depth Track Specifications (Tracks 01 – 30)',
  '## 3. Recommended Phased Execution Strategy',
  '## 4. Strategic Decision Gates & Verification Checklist'
];

expectedSections.forEach(s => {
  if (!content.includes(s)) {
    console.error('FAIL: Missing section:', s);
    process.exit(1);
  }
  console.log('✓ Section present: ' + s);
});

// 2. Check all 30 tracks and all 7 sub-sections
const trackRegex = /^####\s*🔹\s*Track\s+(\d+):\s*(.+)$/;
const sectionRegex = /^#####\s*(\d)\.\s*(.+)$/;

const tracks = {};
let currentTrack = null;

lines.forEach((line, idx) => {
  const tm = line.match(trackRegex);
  if (tm) {
    currentTrack = parseInt(tm[1], 10);
    tracks[currentTrack] = { title: tm[2].trim(), line: idx + 1, sections: [] };
  } else if (currentTrack) {
    const sm = line.match(sectionRegex);
    if (sm) {
      tracks[currentTrack].sections.push({ num: parseInt(sm[1], 10), title: sm[2].trim() });
    }
  }
});

const trackKeys = Object.keys(tracks).map(Number).sort((a,b) => a-b);
console.log('Tracks detected:', trackKeys.length);
if (trackKeys.length !== 30) {
  console.error('FAIL: Expected 30 tracks, got ' + trackKeys.length);
  process.exit(1);
}

for (let i = 1; i <= 30; i++) {
  const t = tracks[i];
  if (!t) {
    console.error('FAIL: Missing Track ' + i);
    process.exit(1);
  }
  if (t.sections.length !== 7) {
    console.error('FAIL: Track ' + i + ' (' + t.title + ') has ' + t.sections.length + ' sections (expected 7)');
    process.exit(1);
  }
  const nums = t.sections.map(s => s.num).sort((a,b) => a-b);
  if (JSON.stringify(nums) !== JSON.stringify([1,2,3,4,5,6,7])) {
    console.error('FAIL: Track ' + i + ' sections order invalid:', nums);
    process.exit(1);
  }
}
console.log('✓ All 30 tracks verified with all 7 mandatory sections each (30 x 7 = 210 sections verified).');

// 3. Check Groups in Section 2
const expectedGroups = [
  '### Group A: Sacred Corpus, Research & Truth Provenance',
  '### Group B: Cognitive AI & Grounded Reasoning Engine',
  '### Group C: Spatial HUD, Visual World & Atmosphere',
  '### Group D: Harbor Community, Ethics & Governance',
  '### Group E: Command Deck & System Telemetry',
  '### Group F: Engineering Excellence, Modularity & Performance'
];

expectedGroups.forEach(g => {
  if (!content.includes(g)) {
    console.error('FAIL: Missing group header: ' + g);
    process.exit(1);
  }
  console.log('✓ Group header present: ' + g);
});

// 4. Check Section 3 Execution Batches
const expectedBatches = [
  'Batch 1: Foundations & Sacred Anchor',
  'Batch 2: Truth Provenance & Audio Resonance',
  'Batch 3: Cognitive Intelligence & Failover',
  'Batch 4: Spatial Immersion & Atmosphere',
  'Batch 5: Harbor Governance & Peer Review',
  'Batch 6: Mission Command & Engineering Hardening'
];

expectedBatches.forEach(b => {
  if (!content.includes(b)) {
    console.error('FAIL: Missing batch: ' + b);
    process.exit(1);
  }
  console.log('✓ Batch present: ' + b);
});

// 5. Check Architectural Compliance:
// - Zero Drizzle schema/import definitions
const hasDrizzleImport = /import.*from.*drizzle/i.test(content);
const hasDrizzleTable = /pgTable|mysqlTable|sqliteTable/i.test(content);
if (hasDrizzleImport || hasDrizzleTable) {
  console.error('FAIL: Prohibited Drizzle import or table declaration found.');
  process.exit(1);
}
console.log('✓ Zero prohibited Drizzle imports/table definitions verified.');

// - QlOrm model usage
const qlModelCount = (content.match(/QlModelDefinition/g) || []).length;
console.log('✓ QlOrm model definitions count:', qlModelCount);
if (qlModelCount < 30) {
  console.error('FAIL: Expected >= 30 QlModelDefinition occurrences');
  process.exit(1);
}

// - MoonClient usage
const moonClientCount = (content.match(/moonClient|MoonClient/g) || []).length;
console.log('✓ moonClient references count:', moonClientCount);
if (moonClientCount < 30) {
  console.error('FAIL: Expected extensive moonClient references');
  process.exit(1);
}

// - Anti-slop tokens
const tokenCount = (content.match(/--color-|--space-|--font-/g) || []).length;
console.log('✓ Design token references count:', tokenCount);
if (tokenCount < 30) {
  console.error('FAIL: Expected design token references');
  process.exit(1);
}

console.log('========================================');
console.log('AUDIT RESULT: 100% PASS - ALL INTEGRITY & ARCHITECTURAL GATES MET');
console.log('========================================');
