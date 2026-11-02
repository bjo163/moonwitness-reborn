const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');
const lines = content.split('\n');

console.log('--- FETCH SNIPPETS ---');
lines.forEach((l, i) => {
  if ((l.includes('fetch(') || l.includes('axios.') || l.includes('XMLHttpRequest')) &&
      !l.includes('git grep') && !l.includes('Prohibited') && !l.includes('forbidden') && !l.includes('Strictly') &&
      !l.includes('event.respondWith') && !l.includes('fetcher:')) {
    console.log((i+1) + ': ' + l);
  }
});

console.log('--- RAW FORMS ---');
lines.forEach((l, i) => {
  if ((l.includes('<button') || l.includes('<input') || l.includes('<select') || l.includes('<textarea')) &&
      !l.includes('git grep') && !l.includes('Prohibited') && !l.includes('forbidden')) {
    console.log((i+1) + ': ' + l);
  }
});

console.log('--- INLINE STYLES ---');
lines.forEach((l, i) => {
  if (l.includes('style={{') && !l.includes('git grep') && !l.includes('Prohibited') && !l.includes('forbidden')) {
    console.log((i+1) + ': ' + l);
  }
});

console.log('--- ARBITRARY HEX IN CLASSES ---');
lines.forEach((l, i) => {
  if (/className="[^"]*#[0-9a-fA-F]{3,6}[^"]*"/.test(l) || /style=.*#[0-9a-fA-F]{3,6}/.test(l)) {
    console.log((i+1) + ': ' + l);
  }
});
