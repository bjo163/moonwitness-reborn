const fs = require('fs');

const targetPath = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(targetPath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('=== FORENSIC DEEP PROBE START ===');

// ==========================================
// CHECK 2: DRIZZLE ORM PROHIBITION
// ==========================================
console.log('\n--- CHECK 2: DRIZZLE ORM PROHIBITION ---');
const drizzleKeywords = [
  /drizzle/i,
  /drizzle-orm/i,
  /pgTable/i,
  /mysqlTable/i,
  /sqliteTable/i,
  /drizzle\.config/i,
  /\.drizzle/i,
  /drizzle-kit/i,
  /drizzleOrm/i
];

let drizzleMatches = [];
lines.forEach((l, idx) => {
  drizzleKeywords.forEach(regex => {
    regex.lastIndex = 0;
    if (regex.test(l)) {
      // Ignore lines that specifically prohibit drizzle (e.g. "strictly NO Drizzle ORM")
      const isProhibitionStatement = /(no\s+drizzle|strictly\s+no\s+drizzle|without\s+drizzle|zero\s+drizzle|prohibit.*drizzle)/i.test(l);
      drizzleMatches.push({ line: idx + 1, text: l.trim(), isProhibitionStatement });
    }
  });
});

console.log(`Total lines mentioning drizzle/table constructs: ${drizzleMatches.length}`);
drizzleMatches.forEach(m => {
  console.log(`  Line ${m.line} [ProhibitionStatement=${m.isProhibitionStatement}]: ${m.text}`);
});

// Check QlOrm model format:
// All models should follow domain.entity naming, under packages/ql_*, using QlModelDefinition
const qlModelMatches = [];
lines.forEach((l, idx) => {
  if (l.includes('QlModelDefinition')) {
    qlModelMatches.push({ line: idx + 1, text: l.trim() });
  }
});
console.log(`Total QlModelDefinition occurrences: ${qlModelMatches.length}`);

// Check if any database model is defined without QlModelDefinition
const modelBlocks = [];
let insideCode = false;
let currentBlock = [];
lines.forEach((l, idx) => {
  if (l.startsWith('```')) {
    if (insideCode) {
      const codeStr = currentBlock.join('\n');
      if (codeStr.includes('export const ') && (codeStr.includes('Model') || codeStr.includes('Definition'))) {
        modelBlocks.push({ line: idx - currentBlock.length, code: codeStr });
      }
      currentBlock = [];
      insideCode = false;
    } else {
      insideCode = true;
    }
  } else if (insideCode) {
    currentBlock.push(l);
  }
});
console.log(`Code blocks declaring models/definitions: ${modelBlocks.length}`);

// ==========================================
// CHECK 3: BOUNDARY AUDIT
// ==========================================
console.log('\n--- CHECK 3: BOUNDARY AUDIT ---');
// Prohibited in apps/web:
// 1. Raw fetch: fetch(
// 2. Direct server package imports: import ... from '@moonwitness/api' or import ... from 'packages/ql_*' in web component code
// 3. Raw HTML form elements: <input, <select, <button, <textarea
// 4. Inline styles: style={{
// 5. Arbitrary colors: hex (#...), rgb(...), or arbitrary tailwind colors (bg-blue-500, text-red-500, etc.)

let rawFetchMatches = [];
let directServerImportMatches = [];
let rawFormElementMatches = [];
let inlineStyleMatches = [];
let arbitraryHexMatches = [];

insideCode = false;
let codeBlockLang = '';

lines.forEach((l, idx) => {
  if (l.startsWith('```')) {
    insideCode = !insideCode;
    codeBlockLang = insideCode ? l.replace('```', '').trim() : '';
    return;
  }

  // Check raw fetch
  if (/\bfetch\s*\(/.test(l)) {
    // Check if it's a rule prohibition or actual usage
    const isProhibition = /(no\s+raw\s+fetch|never\s+use\s+fetch|zero\s+raw\s+fetch|prohibit.*fetch)/i.test(l);
    rawFetchMatches.push({ line: idx + 1, text: l.trim(), isProhibition });
  }

  // Check direct server package imports
  if (/import\s+.*from\s+['"](@moonwitness\/api|packages\/ql_)/.test(l)) {
    directServerImportMatches.push({ line: idx + 1, text: l.trim() });
  }

  // Check raw form elements in TSX/JSX snippets
  if (insideCode && (codeBlockLang === 'tsx' || codeBlockLang === 'typescript' || codeBlockLang === 'jsx' || codeBlockLang === 'ts')) {
    if (/<(button|input|select|textarea)\b/i.test(l)) {
      rawFormElementMatches.push({ line: idx + 1, text: l.trim() });
    }
    if (/style\s*=\s*\{\{/i.test(l)) {
      inlineStyleMatches.push({ line: idx + 1, text: l.trim() });
    }
    // Check arbitrary hex colors inside code snippets
    const hexMatch = l.match(/#[0-9a-fA-F]{3,8}\b/);
    if (hexMatch && !l.includes('SHA-256') && !l.includes('sha256') && !l.includes('hash=') && !l.includes('colorToken') && !l.includes('0x')) {
      arbitraryHexMatches.push({ line: idx + 1, text: l.trim() });
    }
  }
});

console.log(`Raw fetch occurrences: ${rawFetchMatches.length}`);
rawFetchMatches.forEach(m => console.log(`  Line ${m.line} [Prohibition=${m.isProhibition}]: ${m.text}`));

console.log(`Direct server package imports in snippets: ${directServerImportMatches.length}`);
directServerImportMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

console.log(`Raw form elements (<button>, <input>, etc.) in code snippets: ${rawFormElementMatches.length}`);
rawFormElementMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

console.log(`Inline styles (style={{...}}) in code snippets: ${inlineStyleMatches.length}`);
inlineStyleMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

console.log(`Arbitrary hex colors in code snippets: ${arbitraryHexMatches.length}`);
arbitraryHexMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

// ==========================================
// CHECK 4: ANTI-SLOP AUDIT
// ==========================================
console.log('\n--- CHECK 4: ANTI-SLOP AUDIT ---');
// Buzzwords: revolutionary, game-changing, seamless, synergy, paradigm shift, supercharge, unleash, groundbreaking, cutting-edge, next-generation, effortless
const buzzwords = [
  /\brevolutionary\b/gi,
  /\bgame-changing\b/gi,
  /\bseamlessly\b/gi,
  /\bseamless\b/gi,
  /\bsynergy\b/gi,
  /\bparadigm shift\b/gi,
  /\bsupercharge\b/gi,
  /\bunleash\b/gi,
  /\bgroundbreaking\b/gi,
  /\bcutting-edge\b/gi,
  /\bnext-generation\b/gi,
  /\beffortless\b/gi,
  /\beffortlessly\b/gi,
  /\bstate-of-the-art\b/gi
];

let buzzwordMatches = [];
lines.forEach((l, idx) => {
  buzzwords.forEach(b => {
    b.lastIndex = 0;
    if (b.test(l)) {
      buzzwordMatches.push({ line: idx + 1, text: l.trim() });
    }
  });
});

console.log(`Buzzword occurrences: ${buzzwordMatches.length}`);
buzzwordMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

// Check fabricated stats: e.g. "99.9%", "10x", "100x", "1M+", "10,000+", "over 50,000"
const fakeStats = [
  /\b(99\.99?%|10x\s+faster|100x|1M\+|over\s+\d+[\s,]+(users|downloads)|loved by|trusted by over)\b/gi
];
let statMatches = [];
lines.forEach((l, idx) => {
  fakeStats.forEach(s => {
    s.lastIndex = 0;
    if (s.test(l)) {
      statMatches.push({ line: idx + 1, text: l.trim() });
    }
  });
});
console.log(`Fake statistics occurrences: ${statMatches.length}`);
statMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

// Check testimonials / fake social proof
const fakeTestimonials = [
  /\b(what our users say|testimonial|customer review|said [A-Z][a-z]+:|sheikh\s+[a-z]+\s+praised)\b/gi
];
let testimonialMatches = [];
lines.forEach((l, idx) => {
  fakeTestimonials.forEach(t => {
    t.lastIndex = 0;
    if (t.test(l)) {
      testimonialMatches.push({ line: idx + 1, text: l.trim() });
    }
  });
});
console.log(`Testimonial occurrences: ${testimonialMatches.length}`);
testimonialMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

// ==========================================
// CHECK 5: TRACK COMPLETENESS AUDIT
// ==========================================
console.log('\n--- CHECK 5: TRACK COMPLETENESS AUDIT ---');
// Verify Section 3 Execution Batches
const batchRegex = /^#####\s*Batch\s+(\d):\s*(.+)$/;
let currentBatch = null;
let batchTracks = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

lines.forEach((l, idx) => {
  const bm = l.match(batchRegex);
  if (bm) {
    currentBatch = parseInt(bm[1], 10);
  } else if (currentBatch && l.startsWith('- **Track')) {
    // Format: - **Track 26: Unified Module Engine** ...
    const tm = l.match(/- \*\*Track\s+(\d+):/);
    if (tm) {
      batchTracks[currentBatch].push(parseInt(tm[1], 10));
    }
  } else if (l.startsWith('## 4.')) {
    currentBatch = null;
  }
});

console.log('Batch track assignments in Section 3:');
let allAssignedTracks = [];
for (let b = 1; b <= 6; b++) {
  console.log(`  Batch ${b}: Tracks [${batchTracks[b].join(', ')}] (count: ${batchTracks[b].length})`);
  allAssignedTracks.push(...batchTracks[b]);
}

allAssignedTracks.sort((a,b) => a-b);
console.log(`Total tracks assigned across all batches: ${allAssignedTracks.length}`);
console.log(`Unique tracks assigned: ${new Set(allAssignedTracks).size}`);

for (let i = 1; i <= 30; i++) {
  if (!allAssignedTracks.includes(i)) {
    console.error(`  FAIL: Track ${i} missing from Section 3 execution batches!`);
  }
}

console.log('=== FORENSIC DEEP PROBE COMPLETE ===');
