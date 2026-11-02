import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf-8');
const lines = content.split('\n');

const trackRegex = /^####\s+(?:🔹\s+)?Track\s+(\d{2}):\s+(.+)$/;
const sectionRegex = /^#####\s+(\d)\.\s+(.+)$/;

const tracks = [];
let curTrack = null;

lines.forEach((l, idx) => {
  const tm = l.match(trackRegex);
  if (tm) {
    if (curTrack) tracks.push(curTrack);
    curTrack = { num: tm[1], title: tm[2].trim(), line: idx + 1, sections: {} };
  } else if (curTrack) {
    const sm = l.match(sectionRegex);
    if (sm) {
      curTrack.sections[parseInt(sm[1], 10)] = { num: parseInt(sm[1], 10), title: sm[2].trim(), line: idx + 1 };
    }
  }
});
if (curTrack) tracks.push(curTrack);

console.log(`=== AUDIT OF SECTION 5 (UI / UX & ANTI-SLOP) RE-CHECK ===`);

const s5Report = [];

tracks.forEach(t => {
  const s5Line = t.sections[5]?.line;
  const s6Line = t.sections[6]?.line;

  if (s5Line && s6Line) {
    const s5Content = lines.slice(s5Line - 1, s6Line - 1).join('\n');

    // Dials: match `ENERGY`: X, ENERGY: X, ENERGY = X, `ENERGY: X`
    const energyMatch = s5Content.match(/`?ENERGY`?[:=]\s*(\d)/i);
    const rhythmMatch = s5Content.match(/`?RHYTHM`?[:=]\s*(\d)/i);
    const motionMatch = s5Content.match(/`?MOTION`?[:=]\s*(\d)/i);

    // Tokens: CSS variables, .ql-*, tokens.css, or specific design tokens
    const hasTokens = /var\(--|--[a-z0-9_-]+|\.ql-|tokens\.css/i.test(s5Content);

    // Purpose Gate / justification
    const hasPurpose = /Purpose Gate|Purpose Justification|Why this|Why /i.test(s5Content);

    // Accessibility / WCAG
    const hasA11y = /WCAG|accessibility|contrast|keyboard|aria-|screen reader|prefers-reduced-motion/i.test(s5Content);

    // UI States or toolchain rationale
    const hasStatesOrRationale = /Empty|Loading|Error|Success|toolchain|developer tool|offline|minimalist|headless/i.test(s5Content);

    s5Report.push({
      track: t.num,
      title: t.title,
      energy: energyMatch ? energyMatch[1] : null,
      rhythm: rhythmMatch ? rhythmMatch[1] : null,
      motion: motionMatch ? motionMatch[1] : null,
      hasTokens,
      hasPurpose,
      hasA11y,
      hasStatesOrRationale
    });
  }
});

const missingDials = s5Report.filter(r => !r.energy || !r.rhythm || !r.motion);
const missingTokens = s5Report.filter(r => !r.hasTokens);
const missingPurpose = s5Report.filter(r => !r.hasPurpose);
const missingA11y = s5Report.filter(r => !r.hasA11y);

console.log(`Total tracks audited: ${s5Report.length}`);
console.log(`Tracks missing Anti-Slop Dials: ${missingDials.length}`);
if (missingDials.length > 0) console.log(missingDials.map(r => `Track ${r.track}: ${r.title}`));

console.log(`Tracks missing Tokens / CSS classes: ${missingTokens.length}`);
if (missingTokens.length > 0) console.log(missingTokens.map(r => `Track ${r.track}: ${r.title}`));

console.log(`Tracks missing Purpose Gate: ${missingPurpose.length}`);
if (missingPurpose.length > 0) console.log(missingPurpose.map(r => `Track ${r.track}: ${r.title}`));

console.log(`Tracks missing Accessibility / WCAG: ${missingA11y.length}`);
if (missingA11y.length > 0) console.log(missingA11y.map(r => `Track ${r.track}: ${r.title}`));
