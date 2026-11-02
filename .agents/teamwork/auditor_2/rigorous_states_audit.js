const fs = require('fs');
const content = fs.readFileSync('C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md', 'utf8');

const tracks = content.split(/#### 🔹 Track (\d+):/);

console.log('=== RIGOROUS 4 UI STATES AUDIT ===\n');

const auditReport = [];

for (let i = 1; i < tracks.length; i += 2) {
  const trackNum = tracks[i].padStart(2, '0');
  const trackContent = tracks[i + 1];
  const title = trackContent.split('\n')[0].trim();
  
  const sec5Match = trackContent.match(/##### 5\. UI \/ UX & Anti-Slop Specifications([\s\S]*?)##### 6\./);
  if (!sec5Match) {
    auditReport.push({ trackNum, title, pass: false, missing: 'Section 5 missing' });
    continue;
  }
  const sec5 = sec5Match[1];
  
  // Look specifically for UI states block
  // Either under "Canonical 4 UI States" or "UI States"
  // Format is usually:
  // - `empty`: ... OR - *Empty State*: ...
  // - `loading`: ... OR - *Loading State*: ...
  // - `error`: ... OR - *Error State*: ...
  // - `success`: ... OR - *Success State*: ...
  
  const hasEmpty = /(`empty`|\*empty(\s*state)?\*|\bempty\s*:)/i.test(sec5);
  const hasLoading = /(`loading`|\*loading(\s*state)?\*|\bloading\s*:)/i.test(sec5);
  const hasError = /(`error`|\*error(\s*state)?\*|\berror\s*:)/i.test(sec5);
  const hasSuccess = /(`success`|\*success(\s*state)?\*|\bsuccess\s*:)/i.test(sec5);
  const hasMotion = /prefers-reduced-motion/i.test(sec5);
  
  const missing = [];
  if (!hasEmpty) missing.push('empty');
  if (!hasLoading) missing.push('loading');
  if (!hasError) missing.push('error');
  if (!hasSuccess) missing.push('success');
  if (!hasMotion) missing.push('reduced-motion');
  
  auditReport.push({
    trackNum,
    title,
    pass: missing.length === 0,
    missing: missing.join(', ') || 'NONE',
    states: { hasEmpty, hasLoading, hasError, hasSuccess, hasMotion }
  });
}

auditReport.forEach(r => {
  const status = r.pass ? 'PASS' : 'FAIL';
  console.log(`[${status}] Track ${r.trackNum}: ${r.title} | Missing: ${r.missing}`);
});

const failed = auditReport.filter(r => !r.pass);
console.log(`\nTOTAL: ${auditReport.length} tracks. PASSED: ${auditReport.length - failed.length}, FAILED: ${failed.length}`);
