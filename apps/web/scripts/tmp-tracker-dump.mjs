import { readFileSync } from "node:fs";
const t = JSON.parse(readFileSync("docs/governance/task-tracker.json", "utf8"));
const out = [];
const seen = new Set();
function walk(o, depth = 0) {
  if (depth > 8 || o == null || typeof o !== "object" || seen.has(o)) return;
  seen.add(o);
  if (Array.isArray(o)) {
    for (const x of o) walk(x, depth + 1);
    return;
  }
  if (typeof o.id === "string" && /^MW-05(7|8)/.test(o.id)) out.push(o);
  for (const k of Object.keys(o)) walk(o[k], depth + 1);
}
walk(t);
for (const x of out) {
  console.log("=== " + x.id + " [" + (x.state || x.status) + "]");
  console.log("  subject : " + (x.subject || x.title || ""));
  console.log("  label   : " + (x.status_label || ""));
  if (x.acceptance_criteria) console.log("  accept  : " + JSON.stringify(x.acceptance_criteria).slice(0, 300));
  if (x.depends_on) console.log("  deps    : " + JSON.stringify(x.depends_on));
}
