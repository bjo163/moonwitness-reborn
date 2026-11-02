const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  if (line.includes('selectionKeys:') && line.includes('[')) {
    console.log('--- Line ' + (i+1) + ' ---');
    for (let j = Math.max(0, i - 7); j <= i + 1; j++) {
      console.log('  ' + (j+1) + ': ' + lines[j]);
    }
  }
});
