import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const css = readFileSync("packages/ui/styles/components.css", "utf8");
const names = [...new Set([...css.matchAll(/\.(ql-[a-z0-9_-]+)/g)].map((m) => m[1]))];
const consumers = execSync(
  `git grep -l -E "ql-[a-z0-9_-]+" -- apps/web/src packages/ui/src packages/ui/tests apps/web/app || true`,
  { encoding: "utf8" },
).trim().split(/\r?\n/).filter(Boolean);
const haystack = consumers.map((f) => readFileSync(f, "utf8")).join("\n");
const dead = names.filter((n) => !haystack.includes(n));
console.log(`rules: ${names.length}, dead: ${dead.length}`);
console.log(dead.sort().join("\n"));
