const fs = require('fs');

const targetPath = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(targetPath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('=== DETAILED 30-TRACK DEEP SECTION AUDIT ===');

const trackRegex = /^####\s*🔹\s*Track\s+(\d+):\s*(.+)$/;
const sectionRegex = /^#####\s*(\d)\.\s*(.+)$/;

const tracks = {};
let currentTrackNum = null;
let currentSecNum = null;

lines.forEach((l, idx) => {
  const tm = l.match(trackRegex);
  if (tm) {
    currentTrackNum = parseInt(tm[1], 10);
    tracks[currentTrackNum] = {
      title: tm[2].trim(),
      line: idx + 1,
      sections: {}
    };
    currentSecNum = null;
    return;
  }

  if (currentTrackNum) {
    if (l.startsWith('## ') || (l.startsWith('### ') && !l.includes('Group '))) {
      currentTrackNum = null;
      currentSecNum = null;
      return;
    }

    const sm = l.match(sectionRegex);
    if (sm) {
      currentSecNum = parseInt(sm[1], 10);
      tracks[currentTrackNum].sections[currentSecNum] = {
        title: sm[2].trim(),
        line: idx + 1,
        contentLines: []
      };
      return;
    }

    if (currentSecNum && tracks[currentTrackNum].sections[currentSecNum]) {
      tracks[currentTrackNum].sections[currentSecNum].contentLines.push(l);
    }
  }
});

const expectedSectionTitles = [
  'Architecture & Interaction Flow',
  'Component Interfaces & Types',
  'QlOrm Model Declarations & Field Constraints',
  'API Contracts & DTOs',
  'UI/UX & Design System Integration',
  'Phased Implementation Roadmap',
  'Verification & Quality Gates'
];

let allPassed = true;

for (let i = 1; i <= 30; i++) {
  const t = tracks[i];
  if (!t) {
    console.error(`FAIL: Track ${i} not found!`);
    allPassed = false;
    continue;
  }

  const secKeys = Object.keys(t.sections).map(Number).sort((a,b) => a-b);
  if (secKeys.length !== 7) {
    console.error(`FAIL: Track ${i} (${t.title}) has ${secKeys.length} sections, expected 7!`);
    allPassed = false;
  }

  // Check each section content depth
  for (let s = 1; s <= 7; s++) {
    const sec = t.sections[s];
    if (!sec) {
      console.error(`FAIL: Track ${i} missing section ${s}!`);
      allPassed = false;
      continue;
    }

    const contentStr = sec.contentLines.join('\n').trim();
    if (contentStr.length < 100) {
      console.warn(`WARN: Track ${i} Section ${s} content unusually short (${contentStr.length} chars)`);
    }

    // Specific section content checks:
    if (s === 1) { // Architecture
      const hasDiagram = contentStr.includes('```mermaid') || contentStr.includes('flowchart') || contentStr.includes('sequenceDiagram');
      if (!hasDiagram) {
        console.warn(`Track ${i} Section 1 has no Mermaid diagram`);
      }
    } else if (s === 2) { // Interfaces
      const hasCode = contentStr.includes('```typescript') || contentStr.includes('interface ') || contentStr.includes('type ');
      if (!hasCode) {
        console.error(`FAIL: Track ${i} Section 2 has no TypeScript interface/type code block!`);
        allPassed = false;
      }
    } else if (s === 3) { // QlOrm Models
      const hasModel = contentStr.includes('QlModelDefinition') || contentStr.includes('models/');
      if (!hasModel) {
        console.error(`FAIL: Track ${i} Section 3 has no QlModelDefinition!`);
        allPassed = false;
      }
      if (contentStr.includes('drizzle') || contentStr.includes('pgTable')) {
        console.error(`FAIL: Track ${i} Section 3 mentions prohibited Drizzle or pgTable!`);
        allPassed = false;
      }
    } else if (s === 4) { // API Contracts
      const hasDto = contentStr.includes('Dto') || contentStr.includes('Response') || contentStr.includes('Request');
      const hasRoutes = contentStr.includes('apiRoutes') || contentStr.includes('MoonClient');
      if (!hasDto || !hasRoutes) {
        console.error(`FAIL: Track ${i} Section 4 missing DTO or apiRoutes/MoonClient!`);
        allPassed = false;
      }
    } else if (s === 5) { // UI/UX
      const hasTokens = contentStr.includes('--color-') || contentStr.includes('var(') || contentStr.includes('.ql-');
      if (!hasTokens) {
        console.warn(`Track ${i} Section 5 has few or no design token references`);
      }
    } else if (s === 6) { // Phased Roadmap
      const hasPhases = contentStr.includes('Phase') || contentStr.includes('Milestone');
      if (!hasPhases) {
        console.error(`FAIL: Track ${i} Section 6 missing phases/milestones!`);
        allPassed = false;
      }
    } else if (s === 7) { // Verification
      const hasVerif = contentStr.includes('Gate') || contentStr.includes('Test') || contentStr.includes('Criteria');
      if (!hasVerif) {
        console.error(`FAIL: Track ${i} Section 7 missing verification criteria!`);
        allPassed = false;
      }
    }
  }
}

console.log(`Deep section audit result: allPassed=${allPassed}`);
