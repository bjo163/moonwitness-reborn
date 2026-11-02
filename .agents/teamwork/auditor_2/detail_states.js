const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');

for (let i = 1; i <= 30; i++) {
  const numStr = i < 10 ? `0${i}` : `${i}`;
  const nextNumStr = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
  
  const startPattern = `#### 🔹 Track ${numStr}:`;
  const endPattern = i === 30 ? '## 3. Recommended Phased Execution Strategy' : `#### 🔹 Track ${nextNumStr}:`;
  
  const startIdx = content.indexOf(startPattern);
  const endIdx = content.indexOf(endPattern, startIdx);
  
  const trackBlock = content.slice(startIdx, endIdx);
  const sec5Match = trackBlock.match(/##### 5\. UI \/ UX[\s\S]*?(?=##### 6\. Phased Implementation Roadmap)/);
  
  if (!sec5Match) {
    console.log(`Track ${numStr}: Section 5 NOT FOUND`);
    continue;
  }
  
  const sec5 = sec5Match[0];
  const hasEmpty = /empty\s*(state|:|\*)/i.test(sec5);
  const hasLoading = /loading\s*(state|:|\*)/i.test(sec5);
  const hasError = /error\s*(state|:|\*)/i.test(sec5);
  const hasSuccess = /success\s*(state|:|\*)/i.test(sec5);
  const hasMotion = /prefers-reduced-motion/i.test(sec5);
  
  console.log(`Track ${numStr}: empty=${hasEmpty}, loading=${hasLoading}, error=${hasError}, success=${hasSuccess}, motion=${hasMotion}`);
}
