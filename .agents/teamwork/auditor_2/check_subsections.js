const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');

const tracks = content.split(/#### 🔹 Track (\d+):/);
console.log(`Total track segments: ${(tracks.length - 1) / 2}`);

const requiredSubsections = [
  '1. System Architecture',
  '2. Concrete TypeScript Component Interfaces',
  '3. QlOrm Model Declarations',
  '4. API Contracts',
  '5. UI / UX',
  '6. Phased Implementation Roadmap',
  '7. Verification Rubrics'
];

let totalFound = 0;
const missingSubsections = [];

for (let i = 1; i < tracks.length; i += 2) {
  const tNum = tracks[i].padStart(2, '0');
  const tContent = tracks[i + 1];
  
  requiredSubsections.forEach((sub, subIdx) => {
    // sub numbering: e.g. "##### 1. System Architecture"
    const subNum = subIdx + 1;
    const regex = new RegExp(`#####\\s+${subNum}\\.\\s+${sub.slice(3).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (regex.test(tContent)) {
      totalFound++;
    } else {
      missingSubsections.push(`Track ${tNum} missing subsection ${subNum}: ${sub}`);
    }
  });
}

console.log(`Total subsections found: ${totalFound} / 210`);
if (missingSubsections.length > 0) {
  console.log('Missing:', missingSubsections);
} else {
  console.log('ALL 210 SUBSECTIONS VERIFIED (100% COMPLETE)');
}
