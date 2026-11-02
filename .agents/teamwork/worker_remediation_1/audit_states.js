import fs from "node:fs";

const TARGET_PATH = "C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md";
const content = fs.readFileSync(TARGET_PATH, "utf8");

const tracks = content.split(/#### 🔹 Track (\d+):/);
console.log("Found track sections count:", tracks.length);

for (let i = 1; i < tracks.length; i += 2) {
  const trackNum = tracks[i];
  const trackContent = tracks[i + 1];
  const title = trackContent.split("\n")[0].trim();
  const sec5Match = trackContent.match(/##### 5\. UI \/ UX & Anti-Slop Specifications([\s\S]*?)##### 6\./);
  const sec5 = sec5Match ? sec5Match[1] : "NOT FOUND";
  
  const hasEmpty = /empty/i.test(sec5);
  const hasLoading = /loading/i.test(sec5);
  const hasError = /error/i.test(sec5);
  const hasSuccess = /success/i.test(sec5);
  const hasReducedMotion = /reduced-motion/i.test(sec5);

  console.log(`Track ${trackNum.padStart(2, "0")} (${title}): states=[E:${hasEmpty ? "✓" : "✗"} L:${hasLoading ? "✓" : "✗"} Er:${hasError ? "✓" : "✗"} S:${hasSuccess ? "✓" : "✗"}] motion=[${hasReducedMotion ? "✓" : "✗"}]`);
}
