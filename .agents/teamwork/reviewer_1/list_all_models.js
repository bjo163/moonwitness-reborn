import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf-8');
const lines = content.split('\n');

console.log('=== ALL MODEL DECLARATION LOCATIONS ===');
const modelLocs = [];
lines.forEach((l, i) => {
  const m = l.match(/name:\s*["']([a-z0-9_]+\.[a-z0-9_]+)["']/);
  if (m) {
    modelLocs.push({ line: i + 1, modelName: m[1], prev: lines[i - 1]?.trim(), prev2: lines[i - 2]?.trim() });
  }
});
console.log(`Found ${modelLocs.length} model definitions:`);
modelLocs.forEach(ml => {
  console.log(`L${ml.line}: ${ml.modelName} | Header: "${ml.prev2}" / "${ml.prev}"`);
});
