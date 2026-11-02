const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');
const lines = content.split('\n');

const trackHeadings = [];
lines.forEach((l, i) => {
  if (l.match(/^#### 🔹 Track \d+:/)) {
    trackHeadings.push({ line: i + 1, text: l });
  }
});

console.log(`Found ${trackHeadings.length} track headings:`);
trackHeadings.forEach(th => console.log(`Line ${th.line}: ${th.text}`));
