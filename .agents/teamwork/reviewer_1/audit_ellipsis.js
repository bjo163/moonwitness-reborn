import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf-8');
const lines = content.split('\n');

console.log(`\n=== DEEP ELLIPSIS AUDIT ===`);
const ellipsisLines = [];
lines.forEach((l, i) => {
  if (l.includes('...')) {
    const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 4)).join('\n');
    ellipsisLines.push({ lineNum: i + 1, text: l.trim(), context });
  }
});
console.log(`Total occurrences: ${ellipsisLines.length}`);

let codeBlockOmissions = 0;
ellipsisLines.forEach(e => {
  const isApiRoutesObj = /apiRoutes/i.test(e.context);
  const isJsxSpread = /\{\s*\.\.\.[a-zA-Z0-9_]+\s*\}/.test(e.text) || /\.\.\.[a-zA-Z0-9_]+/.test(e.text);
  const isQuoteOrUrl = /"|\.\.\.\?hash=|\.\.\.\s*”|dan lain-lain/i.test(e.text);
  const isCommentInApiRoutes = isApiRoutesObj && /^\/\/\s*\.\.\./.test(e.text);
  
  if (!isCommentInApiRoutes && !isJsxSpread && !isQuoteOrUrl) {
    console.log(`POTENTIAL OMISSION at L${e.lineNum}: ${e.text}`);
    console.log(`Context:\n${e.context}\n---`);
    codeBlockOmissions++;
  }
});
console.log(`Total unclassified / potential code block omissions: ${codeBlockOmissions}`);
