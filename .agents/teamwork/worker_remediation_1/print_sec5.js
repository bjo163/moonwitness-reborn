import fs from "node:fs";

const TARGET_PATH = "C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md";
const content = fs.readFileSync(TARGET_PATH, "utf8");

const tracks = content.split(/#### 🔹 Track (\d+):/);

for (let i = 1; i < tracks.length; i += 2) {
  const trackNum = parseInt(tracks[i], 10);
  if (trackNum >= 4) {
    const trackContent = tracks[i + 1];
    const sec5Match = trackContent.match(/##### 5\. UI \/ UX & Anti-Slop Specifications([\s\S]*?)##### 6\./);
    console.log(`\n=================== Track ${trackNum} ===================`);
    console.log(sec5Match ? sec5Match[0].trim() : "NOT FOUND");
  }
}
