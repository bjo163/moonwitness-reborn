const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');

const models = [
  'workflow.covenant_signature',
  'community.study_circle',
  'community.circle_reflection',
  'community.beneficial_deed'
];

models.forEach(m => {
  const idx = content.indexOf(`name: "${m}"`);
  const chunk = content.slice(idx - 50, idx + 800);
  console.log(`=== MODEL: ${m} ===`);
  console.log('Has ownerField:', chunk.includes('ownerField:'));
  const lines = chunk.split('\n').slice(0, 30);
  console.log(lines.join('\n'));
});
