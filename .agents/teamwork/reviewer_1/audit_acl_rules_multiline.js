import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf-8');

// Match all ACL object blocks: { ... model: "...", ... group: "...", ... }
const aclBlockRegex = /\{\s*model:\s*["']([a-z0-9_]+\.[a-z0-9_]+)["'][\s\S]*?group:\s*["']([a-z0-9_]+)["'][\s\S]*?read:\s*(true|false)[\s\S]*?write:\s*(true|false)[\s\S]*?create:\s*(true|false)[\s\S]*?unlink:\s*(true|false)[\s\S]*?\}/g;

let match;
const aclRules = [];
while ((match = aclBlockRegex.exec(content)) !== null) {
  aclRules.push({
    model: match[1],
    group: match[2],
    read: match[3] === 'true',
    write: match[4] === 'true',
    create: match[5] === 'true',
    unlink: match[6] === 'true'
  });
}

console.log(`=== ACL RULES MULTI-LINE AUDIT ===`);
console.log(`Total parsed ACL rule blocks: ${aclRules.length}`);
const uniqueModels = [...new Set(aclRules.map(r => r.model))];
console.log(`Distinct models covered by ACL rules (${uniqueModels.length}):`);
console.log(uniqueModels.sort().join(', '));

// Check deny-by-default: viewer should NEVER have write: true, create: true, or unlink: true
const viewerViolations = aclRules.filter(r => r.group === 'viewer' && (r.write || r.create || r.unlink));
console.log(`Viewer privilege escalations (write/create/unlink true): ${viewerViolations.length}`);
if (viewerViolations.length > 0) {
  console.log(viewerViolations);
}

// Check anonymous / public access
const publicRules = aclRules.filter(r => r.group === 'public' || r.group === 'anon');
console.log(`Public/Anonymous ACL rules: ${publicRules.length}`);
