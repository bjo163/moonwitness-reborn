const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');

const missingStates = [];
const compliantTracks = [];

for (let i = 1; i <= 30; i++) {
  const numStr = i < 10 ? `0${i}` : `${i}`;
  const nextNumStr = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
  
  const startPattern = `#### 🔹 Track ${numStr}:`;
  const endPattern = i === 30 ? '## 3. Recommended Phased Execution Strategy' : `#### 🔹 Track ${nextNumStr}:`;
  
  const startIdx = content.indexOf(startPattern);
  const endIdx = content.indexOf(endPattern, startIdx);
  
  if (startIdx === -1 || endIdx === -1) {
    missingStates.push(`Track ${numStr}: Heading not found (start=${startIdx}, end=${endIdx})`);
    continue;
  }
  
  const trackBlock = content.slice(startIdx, endIdx);
  const sec5Match = trackBlock.match(/##### 5\. UI \/ UX[\s\S]*?(?=##### 6\. Phased Implementation Roadmap)/);
  
  if (!sec5Match) {
    missingStates.push(`Track ${numStr}: Section 5 not found`);
    continue;
  }
  
  const sec5 = sec5Match[0];
  const hasEmpty = sec5.includes('`empty`') || /-\s*`?empty`?:/i.test(sec5);
  const hasLoading = sec5.includes('`loading`') || /-\s*`?loading`?:/i.test(sec5);
  const hasError = sec5.includes('`error`') || /-\s*`?error`?:/i.test(sec5);
  const hasSuccess = sec5.includes('`success`') || /-\s*`?success`?:/i.test(sec5);
  const hasMotion = /prefers-reduced-motion/i.test(sec5);
  
  if (hasEmpty && hasLoading && hasError && hasSuccess && hasMotion) {
    compliantTracks.push(numStr);
  } else {
    missingStates.push(`Track ${numStr}: [empty:${hasEmpty}, loading:${hasLoading}, error:${hasError}, success:${hasSuccess}, motion:${hasMotion}]`);
  }
}

console.log(`Compliant tracks: ${compliantTracks.length} / 30`);
if (missingStates.length > 0) {
  console.log('Non-compliant:', missingStates);
} else {
  console.log('ALL 30 TRACKS COMPLIANT (100%)');
}
