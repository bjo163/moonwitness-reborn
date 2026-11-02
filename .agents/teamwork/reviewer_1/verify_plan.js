import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';

const content = fs.readFileSync(PLAN_PATH, 'utf-8');
const lines = content.split('\n');

console.log(`=== PLAN ANALYSIS ===`);
console.log(`Total lines: ${lines.length}`);
console.log(`Total bytes: ${Buffer.byteLength(content, 'utf-8')}`);

// 1. Prohibited Architecture Checks (Drizzle / Raw Migrations)
console.log(`\n--- 1. Prohibited Architecture Checks (Drizzle / Raw Migrations) ---`);
const drizzleMatches = [];
lines.forEach((line, idx) => {
  if (/drizzle/i.test(line)) {
    drizzleMatches.push({ lineNum: idx + 1, text: line.trim() });
  }
});
console.log(`Total mentions of 'drizzle': ${drizzleMatches.length}`);
drizzleMatches.forEach(m => {
  const isNegativeAssertion = /no drizzle|zero drizzle|strictly prohibited|prohibition|without drizzle/i.test(m.text);
  console.log(`  L${m.lineNum}: [NegativeAssertion: ${isNegativeAssertion}] ${m.text}`);
});

const pgTableMatches = lines.filter(l => /pgTable|mysqlTable|sqliteTable/i.test(l));
console.log(`Matches for pgTable/mysqlTable/sqliteTable: ${pgTableMatches.length}`);

// 2. Track identification & Standardized 7-Section Verification
console.log(`\n--- 2. Track Coverage & Standardized 7-Section Verification ---`);
// Notice format: #### 🔹 Track 01: Mushaf Typography & Diacritics Engine
const trackRegex = /^####\s+(?:🔹\s+)?Track\s+(\d{2}):\s+(.+)$/;
// Notice format: ##### 1. System Architecture & Interaction Flow
const sectionRegex = /^#####\s+(\d)\.\s+(.+)$/;

const tracks = [];
let currentTrack = null;

lines.forEach((line, idx) => {
  const tMatch = line.match(trackRegex);
  if (tMatch) {
    if (currentTrack) {
      tracks.push(currentTrack);
    }
    currentTrack = {
      num: tMatch[1],
      title: tMatch[2].trim(),
      startLine: idx + 1,
      endLine: null,
      sections: []
    };
  } else if (currentTrack) {
    const sMatch = line.match(sectionRegex);
    if (sMatch) {
      currentTrack.sections.push({
        num: parseInt(sMatch[1], 10),
        title: sMatch[2].trim(),
        lineNum: idx + 1
      });
    }
  }
});
if (currentTrack) {
  tracks.push(currentTrack);
}

// Calculate endLines
for (let i = 0; i < tracks.length; i++) {
  tracks[i].endLine = (i < tracks.length - 1) ? tracks[i + 1].startLine - 1 : lines.length;
}

console.log(`Total tracks detected: ${tracks.length} / 30`);
tracks.forEach(t => {
  console.log(`Track ${t.num} (${t.title}): lines ${t.startLine}-${t.endLine} (${t.endLine - t.startLine + 1} lines), sections: ${t.sections.length}`);
});

const missingTracks = [];
for (let i = 1; i <= 30; i++) {
  const numStr = String(i).padStart(2, '0');
  const found = tracks.find(t => t.num === numStr);
  if (!found) {
    missingTracks.push(numStr);
  }
}
console.log(`Missing tracks: ${missingTracks.length > 0 ? missingTracks.join(', ') : 'NONE'}`);

// Standard 7 section names expected:
// 1. System Architecture & Interaction Flow
// 2. Concrete TypeScript Component Interfaces / Signatures
// 3. QlOrm Model Declarations & Field Constraints
// 4. API Contracts & DTOs
// 5. UI / UX & Anti-Slop Specifications
// 6. Phased Implementation Roadmap
// 7. Verification Rubrics & Acceptance Criteria
const sectionViolations = [];
tracks.forEach(t => {
  const secNums = t.sections.map(s => s.num);
  const hasAll7 = [1, 2, 3, 4, 5, 6, 7].every(n => secNums.includes(n));
  if (!hasAll7 || t.sections.length !== 7) {
    sectionViolations.push({
      track: t.num,
      title: t.title,
      sectionCount: t.sections.length,
      sectionsFound: secNums,
      sectionTitles: t.sections.map(s => `${s.num}. ${s.title}`)
    });
  }
});
console.log(`Tracks with section structure anomalies: ${sectionViolations.length}`);
if (sectionViolations.length > 0) {
  console.log(JSON.stringify(sectionViolations, null, 2));
}

// 3. QlOrm Model Inspection across Tracks
console.log(`\n--- 3. QlOrm Model Inspection ---`);
const qlModelRegex = /name:\s*["']([a-z0-9_]+\.[a-z0-9_]+)["']/g;
const modelMatches = [];
let match;
while ((match = qlModelRegex.exec(content)) !== null) {
  modelMatches.push(match[1]);
}
console.log(`Total QlOrm model definitions found: ${modelMatches.length}`);
const uniqueModels = [...new Set(modelMatches)];
console.log(`Unique QlOrm models (${uniqueModels.length}):`);
console.log(uniqueModels.join(', '));

// Check field types in QlOrm models
const allowedFieldTypes = new Set(['char', 'text', 'integer', 'boolean', 'datetime']);
// Let's inspect fields defined inside each track's section 3
const invalidFieldTypes = [];
tracks.forEach(t => {
  const sec3 = t.sections.find(s => s.num === 3);
  const sec4 = t.sections.find(s => s.num === 4);
  if (sec3 && sec4) {
    const sec3Content = lines.slice(sec3.lineNum - 1, sec4.lineNum - 1).join('\n');
    // Search for fields: { ... type: "..." }
    const fieldTypeInSec3Regex = /type:\s*["']([^"']+)["']/g;
    let ftMatch;
    while ((ftMatch = fieldTypeInSec3Regex.exec(sec3Content)) !== null) {
      const typeVal = ftMatch[1];
      if (!allowedFieldTypes.has(typeVal)) {
        invalidFieldTypes.push({ track: t.num, type: typeVal });
      }
    }
  }
});
console.log(`Invalid QlOrm field types found in Section 3s: ${invalidFieldTypes.length}`);
if (invalidFieldTypes.length > 0) {
  console.log(JSON.stringify(invalidFieldTypes, null, 2));
}

// Check ownerField in models
let ownerFieldCount = 0;
lines.forEach(l => {
  if (/ownerField:\s*["']owner_id["']/.test(l)) ownerFieldCount++;
});
console.log(`ownerField: "owner_id" declarations: ${ownerFieldCount}`);

// Check private: true in sensitive models
let privateTrueCount = 0;
lines.forEach(l => {
  if (/private:\s*true/.test(l)) privateTrueCount++;
});
console.log(`private: true declarations: ${privateTrueCount}`);

// 4. MoonClient route & DTO inspection
console.log(`\n--- 4. MoonClient Routes & DTO Inspection ---`);
const apiRouteRegex = /apiRoutes\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/g;
const routeMatches = [];
while ((match = apiRouteRegex.exec(content)) !== null) {
  routeMatches.push(`${match[1]}.${match[2]}`);
}
console.log(`Total apiRoutes references: ${routeMatches.length}`);
console.log(`Unique routes: ${[...new Set(routeMatches)].length}`);

// Check each track's section 4 for DTOs and MoonClient signatures
const tracksMissingDtoOrClient = [];
tracks.forEach(t => {
  const sec4 = t.sections.find(s => s.num === 4);
  const sec5 = t.sections.find(s => s.num === 5);
  if (sec4 && sec5) {
    const sec4Content = lines.slice(sec4.lineNum - 1, sec5.lineNum - 1).join('\n');
    const hasRequestDto = /RequestDto/i.test(sec4Content);
    const hasResponseDto = /ResponseDto/i.test(sec4Content);
    const hasMoonClient = /moonClient|MoonClient/i.test(sec4Content);
    const hasApiRoutes = /apiRoutes\./.test(sec4Content);
    if (!hasRequestDto || !hasResponseDto || !hasMoonClient || !hasApiRoutes) {
      tracksMissingDtoOrClient.push({
        track: t.num,
        hasRequestDto,
        hasResponseDto,
        hasMoonClient,
        hasApiRoutes
      });
    }
  }
});
console.log(`Tracks missing full Section 4 contracts: ${tracksMissingDtoOrClient.length}`);
if (tracksMissingDtoOrClient.length > 0) {
  console.log(JSON.stringify(tracksMissingDtoOrClient, null, 2));
}

// 5. Section 5 UI / UX & Anti-Slop Specifications
console.log(`\n--- 5. UI / UX & Anti-Slop Specifications Inspection ---`);
const tracksMissingUiSpecs = [];
tracks.forEach(t => {
  const sec5 = t.sections.find(s => s.num === 5);
  const sec6 = t.sections.find(s => s.num === 6);
  if (sec5 && sec6) {
    const sec5Content = lines.slice(sec5.lineNum - 1, sec6.lineNum - 1).join('\n');
    const hasEnergy = /ENERGY/i.test(sec5Content);
    const hasRhythm = /RHYTHM/i.test(sec5Content);
    const hasMotion = /MOTION/i.test(sec5Content);
    const hasTokens = /var\(--|tokens\.css|\.ql-/i.test(sec5Content);
    const hasWcag = /WCAG/i.test(sec5Content);
    if (!hasEnergy || !hasRhythm || !hasMotion || !hasTokens || !hasWcag) {
      tracksMissingUiSpecs.push({
        track: t.num,
        hasEnergy,
        hasRhythm,
        hasMotion,
        hasTokens,
        hasWcag
      });
    }
  }
});
console.log(`Tracks missing UI tokens/Anti-Slop specs: ${tracksMissingUiSpecs.length}`);
if (tracksMissingUiSpecs.length > 0) {
  console.log(JSON.stringify(tracksMissingUiSpecs, null, 2));
}

// 6. Section 3 Batch Execution Roadmap Inspection
console.log(`\n--- 6. Section 3 Batch Roadmap Inspection ---`);
const batchRegex = /^####\s+📦\s+Batch\s+(\d):\s+(.+)$/;
const batches = [];
lines.forEach((line, idx) => {
  const bMatch = line.match(batchRegex);
  if (bMatch) {
    batches.push({
      batchNum: parseInt(bMatch[1], 10),
      name: bMatch[2].trim(),
      lineNum: idx + 1
    });
  }
});
console.log(`Found ${batches.length} batches in Section 3:`);
batches.forEach(b => console.log(`  Batch ${b.batchNum} (L${b.lineNum}): ${b.name}`));

const sec3Start = lines.findIndex(l => /^## 3\.\s+Recommended Phased Execution Strategy/.test(l));
const sec4Start = lines.findIndex(l => /^## 4\.\s+Strategic Decision Gates/.test(l));
const sec3Text = lines.slice(sec3Start, sec4Start).join('\n');

const batchTrackMapping = {};
for (let b = 1; b <= 6; b++) {
  batchTrackMapping[b] = [];
}

for (let i = 1; i <= 30; i++) {
  const numStr = String(i).padStart(2, '0');
  for (let b = 1; b <= 6; b++) {
    const curBatchStart = batches.find(x => x.batchNum === b)?.lineNum || sec3Start;
    const nextBatchStart = (b < 6) ? batches.find(x => x.batchNum === b + 1)?.lineNum : sec4Start;
    const batchText = lines.slice(curBatchStart - 1, nextBatchStart - 1).join('\n');
    if (new RegExp(`Track ${numStr}\\b`, 'i').test(batchText)) {
      batchTrackMapping[b].push(numStr);
    }
  }
}

for (let b = 1; b <= 6; b++) {
  console.log(`Batch ${b} contains tracks: ${batchTrackMapping[b].join(', ')}`);
}

const allTracksInBatches = Object.values(batchTrackMapping).flat();
const uniqueTracksInBatches = [...new Set(allTracksInBatches)];
console.log(`Total distinct tracks across batches: ${uniqueTracksInBatches.length} / 30`);
const missingInBatches = [];
for (let i = 1; i <= 30; i++) {
  const numStr = String(i).padStart(2, '0');
  if (!uniqueTracksInBatches.includes(numStr)) {
    missingInBatches.push(numStr);
  }
}
console.log(`Tracks completely missing from batches: ${missingInBatches.length > 0 ? missingInBatches.join(', ') : 'NONE'}`);

// 7. Integrity & Facade Checks (Placeholders / Ellipses)
console.log(`\n--- 7. Integrity & Facade Checks ---`);
// Let's inspect where ellipsis occur in the file
const ellipsisLines = [];
lines.forEach((line, idx) => {
  if (line.includes('...')) {
    ellipsisLines.push({ lineNum: idx + 1, text: line.trim() });
  }
});
console.log(`Total lines with '...': ${ellipsisLines.length}`);
// Print first 20 ellipsis lines to inspect context
ellipsisLines.slice(0, 25).forEach(e => console.log(`  L${e.lineNum}: ${e.text}`));
