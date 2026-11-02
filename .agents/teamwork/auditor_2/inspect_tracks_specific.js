const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');

function getTrackContent(numStr, nextNumStr) {
  const start = content.indexOf(`#### 🔹 Track ${numStr}:`);
  const end = nextNumStr ? content.indexOf(`#### 🔹 Track ${nextNumStr}:`) : content.indexOf('## 3. Recommended Phased Execution Strategy');
  return content.slice(start, end);
}

console.log('=== TRACK 17 SANAD QUERY ===');
const t17 = getTrackContent('17', '18');
const t17Lines = t17.split('\n');
t17Lines.forEach((l, i) => {
  if (l.includes('findManyByService')) {
    console.log(t17Lines.slice(Math.max(0, i - 1), Math.min(t17Lines.length, i + 8)).join('\n'));
    console.log('---');
  }
});

console.log('=== TRACK 24 MOONCLIENT DOWNLOADBLOB ===');
const t24 = getTrackContent('24', '25');
const t24Lines = t24.split('\n');
t24Lines.forEach((l, i) => {
  if (l.includes('downloadBlob') || l.includes('rawRequest') || l.includes('exportResearchArtifact')) {
    console.log(t24Lines.slice(Math.max(0, i - 1), Math.min(t24Lines.length, i + 8)).join('\n'));
    console.log('---');
  }
});

console.log('=== TRACK 07 VIEWER & SSRF ===');
const t07 = getTrackContent('07', '08');
const t07Lines = t07.split('\n');
t07Lines.forEach((l, i) => {
  if (l.includes('viewer') || l.includes('endpoint_url') || l.includes('SSRF') || l.includes('169.254')) {
    console.log(`${i+1}: ${l}`);
  }
});
