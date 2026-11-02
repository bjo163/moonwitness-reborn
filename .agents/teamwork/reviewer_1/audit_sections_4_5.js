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

console.log(`=== AUDIT OF SECTION 4 (API & DTO) & SECTION 5 (UI & ANTI-SLOP) ===`);
console.log(`Total tracks: ${tracks.length}`);

const s4Summary = [];
const s5Summary = [];

tracks.forEach(t => {
  // Section 4 bounds
  const s4Line = t.sections[4]?.line;
  const s5Line = t.sections[5]?.line;
  const s6Line = t.sections[6]?.line;

  if (s4Line && s5Line) {
    const s4Content = lines.slice(s4Line - 1, s5Line - 1).join('\n');
    const hasRequestDto = /RequestDto/i.test(s4Content);
    const hasResponseDto = /ResponseDto/i.test(s4Content);
    const hasItemDto = /ItemDto/i.test(s4Content);
    const hasMoonClient = /MoonClient|moonClient/i.test(s4Content);
    const hasApiRoutes = /apiRoutes\./i.test(s4Content);
    const hasFrozenRoutes = /as const/i.test(s4Content);

    s4Summary.push({
      track: t.num,
      hasRequestDto,
      hasResponseDto,
      hasItemDto,
      hasMoonClient,
      hasApiRoutes,
      hasFrozenRoutes,
      lineCount: s5Line - s4Line
    });
  }

  if (s5Line && s6Line) {
    const s5Content = lines.slice(s5Line - 1, s6Line - 1).join('\n');
    const hasEnergy = /ENERGY:\s*\d|ENERGY\s*=\s*\d/i.test(s5Content);
    const hasRhythm = /RHYTHM:\s*\d|RHYTHM\s*=\s*\d/i.test(s5Content);
    const hasMotion = /MOTION:\s*\d|MOTION\s*=\s*\d/i.test(s5Content);
    const hasTokens = /tokens\.css|var\(--|\.ql-/i.test(s5Content);
    const hasWcag = /WCAG|contrast|keyboard|aria-/i.test(s5Content);
    const hasStates = /Loading|Error|Empty|Success/i.test(s5Content);
    const hasI18n = /id\.po|en\.po|id:|en:|translations/i.test(s5Content);

    s5Summary.push({
      track: t.num,
      hasEnergy,
      hasRhythm,
      hasMotion,
      hasTokens,
      hasWcag,
      hasStates,
      hasI18n,
      lineCount: s6Line - s5Line
    });
  }
});

console.log(`\n--- Section 4 Status (API Contracts & DTOs) ---`);
const s4Issues = s4Summary.filter(s => !s.hasResponseDto || !s.hasMoonClient || !s.hasApiRoutes);
console.log(`Tracks with Section 4 anomalies: ${s4Issues.length}`);
if (s4Issues.length > 0) {
  console.log(JSON.stringify(s4Issues, null, 2));
} else {
  console.log('All 30 tracks have complete Section 4 API contracts (ResponseDto, MoonClient method, apiRoutes)!');
}

console.log(`\n--- Section 5 Status (UI / UX & Anti-Slop) ---`);
const s5Issues = s5Summary.filter(s => !s.hasEnergy || !s.hasRhythm || !s.hasMotion || !s.hasTokens || !s.hasWcag);
console.log(`Tracks with Section 5 anomalies: ${s5Issues.length}`);
if (s5Issues.length > 0) {
  console.log(JSON.stringify(s5Issues, null, 2));
} else {
  console.log('All 30 tracks have complete Section 5 UI / UX & Anti-Slop specs (ENERGY, RHYTHM, MOTION, Tokens, WCAG)!');
}

console.log('\n--- Section 5 Details for Any Missing Elements ---');
s5Summary.forEach(s => {
  const missing = [];
  if (!s.hasEnergy) missing.push('ENERGY');
  if (!s.hasRhythm) missing.push('RHYTHM');
  if (!s.hasMotion) missing.push('MOTION');
  if (!s.hasTokens) missing.push('Tokens');
  if (!s.hasWcag) missing.push('WCAG/Accessibility');
  if (!s.hasStates) missing.push('UI States');
  if (!s.hasI18n) missing.push('I18n');
  if (missing.length > 0) {
    console.log(`Track ${s.track}: Missing [${missing.join(', ')}]`);
  }
});
