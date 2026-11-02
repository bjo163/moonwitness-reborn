const fs = require('fs');
const path = require('path');

const targetPath = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';

if (!fs.existsSync(targetPath)) {
  console.error('FAIL: Target artifact does not exist at ' + targetPath);
  process.exit(1);
}

const content = fs.readFileSync(targetPath, 'utf8');
const lines = content.split(/\r?\n/);
console.log(`Loaded artifact: ${lines.length} lines, ${content.length} bytes.`);

// ==========================================
// AUDIT 1: CHEATING & FACADE AUDIT
// ==========================================
console.log('\n==========================================');
console.log('AUDIT 1: CHEATING & FACADE AUDIT');
console.log('==========================================');

const cheatingPatterns = [
  { name: 'TODO / FIXME / TBD', regex: /\b(TODO|FIXME|TBD|PLACEHOLDER|STUB|XXX)\b/gi },
  { name: 'Ellipses in code blocks', regex: /\.\.\./g },
  { name: 'Not implemented / unimplemented', regex: /\b(not\s+implemented|unimplemented|throw new Error\(['"]Not implemented['"]\))/gi },
  { name: 'Hardcoded test / mock return values', regex: /\breturn\s+(true|false|null|['"][a-zA-Z0-9_\s]+['"]|\{\s*\})\s*;\s*\/\/\s*mock/gi },
  { name: 'Dummy / facade indicator', regex: /\b(dummy|mock|facade|fake)\b/gi }
];

cheatingPatterns.forEach(p => {
  let matches = [];
  lines.forEach((line, idx) => {
    // Reset regex index if global
    p.regex.lastIndex = 0;
    if (p.regex.test(line)) {
      matches.push({ lineNum: idx + 1, text: line.trim() });
    }
  });
  console.log(`Pattern [${p.name}]: ${matches.length} matches`);
  if (matches.length > 0) {
    matches.slice(0, 15).forEach(m => console.log(`  Line ${m.lineNum}: ${m.text}`));
    if (matches.length > 15) console.log(`  ... and ${matches.length - 15} more`);
  }
});

// Let's specifically inspect occurrences of '...'
// Are they in TypeScript/code blocks as spread operator or as lazy placeholder truncation?
let codeBlockEllipses = [];
let insideCodeBlock = false;
let codeLang = '';

lines.forEach((line, idx) => {
  if (line.startsWith('```')) {
    if (!insideCodeBlock) {
      insideCodeBlock = true;
      codeLang = line.replace('```', '').trim();
    } else {
      insideCodeBlock = false;
      codeLang = '';
    }
    return;
  }
  if (insideCodeBlock) {
    if (line.includes('...')) {
      // Check if it's spread operator (e.g., ...rest, ...options, ...record, ...spread) or placeholder (e.g., // ... or just ...)
      const isSpread = /\.\.\.[a-zA-Z0-9_]+|\.\.\.args|\.\.\.props|\.\.\.options/.test(line);
      const isParamSpread = /\(\s*\.\.\./.test(line);
      if (!isSpread && !isParamSpread) {
        codeBlockEllipses.push({ lineNum: idx + 1, lang: codeLang, text: line.trim() });
      }
    }
  }
});

console.log(`\nCode block potential lazy ellipses (excluding spread operators): ${codeBlockEllipses.length}`);
codeBlockEllipses.forEach(e => {
  console.log(`  Line ${e.lineNum} [${e.lang}]: ${e.text}`);
});
