import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf-8');
const lines = content.split('\n');

const ruleLines = [];
lines.forEach((l, i) => {
  if (/group:\s*["'](root|admin|operator|user|viewer)["']/.test(l)) {
    ruleLines.push({ line: i + 1, text: l.trim() });
  }
});

console.log(`Total ACL rule lines with groups: ${ruleLines.length}`);
console.log('Sample ACL lines:');
ruleLines.slice(0, 20).forEach(r => console.log(`L${r.line}: ${r.text}`));

// Let's check which models have access rules defined
const modelWithRules = new Set();
ruleLines.forEach(r => {
  const mMatch = r.text.match(/model:\s*["']([a-z0-9_]+\.[a-z0-9_]+)["']/);
  if (mMatch) {
    modelWithRules.add(mMatch[1]);
  }
});
console.log(`\nModels with explicit ACL rules (${modelWithRules.size}):`);
console.log(Array.from(modelWithRules).sort().join(', '));
