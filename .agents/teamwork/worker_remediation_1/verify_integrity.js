import fs from "node:fs";

const TARGET_PATH = "C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md";
const content = fs.readFileSync(TARGET_PATH, "utf8");

console.log("==================================================================");
console.log("RUNNING FORENSIC INTEGRITY AUDIT PROBE");
console.log("==================================================================");

// 1. Cheating / Stubs / Placeholders
const badPatterns = /\b(TODO|FIXME|TBD|PLACEHOLDER|STUB|XXX)\b/g;
let match;
let badCount = 0;
while ((match = badPatterns.exec(content)) !== null) {
  // Check context if it's legitimate (e.g. "placeholder variable" in i18n or CSS skeleton)
  const start = Math.max(0, match.index - 40);
  const end = Math.min(content.length, match.index + 40);
  const snippet = content.slice(start, end).replace(/\n/g, " ");
  if (/placeholder\s+(variable|skeleton|fallback|guide)/i.test(snippet)) {
    // legitimate design token / skeleton terminology
    continue;
  }
  console.warn(`Potential stub token found: "${match[0]}" at snippet: ...${snippet}...`);
  badCount++;
}

console.log(`Cheating/stub tokens found: ${badCount}`);

// 2. Prohibited Drizzle ORM usage
const drizzleMatches = (content.match(/pgTable|mysqlTable|sqliteTable|drizzle-orm|drizzle\.config/gi) || []).length;
console.log(`Drizzle table definitions found: ${drizzleMatches}`);

// 3. Raw fetch in client components
const rawFetchMatches = (content.match(/window\.fetch|global\.fetch|axios\.get|axios\.post/gi) || []).length;
console.log(`Raw fetch/axios calls in components: ${rawFetchMatches}`);

// 4. QlOrm models total count
const qlModels = (content.match(/name:\s*"[a-z0-9_]+\.[a-z0-9_]+"/g) || []).length;
console.log(`Total QlOrm model definitions: ${qlModels}`);

if (badCount === 0 && drizzleMatches === 0 && rawFetchMatches === 0 && qlModels >= 35) {
  console.log("FORENSIC INTEGRITY AUDIT PASSED: ZERO INTEGRITY VIOLATIONS DETECTED.");
} else {
  console.error("FORENSIC INTEGRITY AUDIT FAILED!");
  process.exit(1);
}
