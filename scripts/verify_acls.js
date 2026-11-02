const fs = require('fs');

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf8');

// Match ACL objects in typescript/javascript code blocks or text
// Typical format:
// {
//   model: "...",
//   group: "...",
//   read: true/false,
//   write: true/false,
//   create: true/false,
//   unlink: true/false,
// }

const aclRegex = /\{\s*model:\s*["']([^"']+)["']\s*,\s*group:\s*["']([^"']+)["']\s*,\s*read:\s*(true|false)\s*,\s*write:\s*(true|false)\s*,\s*create:\s*(true|false)\s*,\s*unlink:\s*(true|false)\s*,?\s*\}/g;

let match;
const aclRules = [];
while ((match = aclRegex.exec(content)) !== null) {
  aclRules.push({
    model: match[1],
    group: match[2],
    read: match[3] === 'true',
    write: match[4] === 'true',
    create: match[5] === 'true',
    unlink: match[6] === 'true',
  });
}

console.log('Total ACL rules parsed:', aclRules.length);

const rulesByModel = new Map();
aclRules.forEach(rule => {
  if (!rulesByModel.has(rule.model)) {
    rulesByModel.set(rule.model, []);
  }
  rulesByModel.get(rule.model).push(rule);
});

console.log('\n========================================');
console.log('ACL RULES PER MODEL:');
console.log('========================================');

for (const [model, rules] of rulesByModel.entries()) {
  console.log(`\nModel: ${model}`);
  rules.forEach(r => {
    console.log(`  group: ${r.group.padEnd(10)} | read: ${String(r.read).padEnd(5)} | write: ${String(r.write).padEnd(5)} | create: ${String(r.create).padEnd(5)} | unlink: ${String(r.unlink).padEnd(5)}`);
  });
}

// Let's also load the 35 declared models from verify_plan.js logic and compare coverage!
const modelsWithAcl = new Set(rulesByModel.keys());

console.log('\n========================================');
console.log('CHECKING ACL COVERAGE FOR ALL 35 MODELS:');
console.log('========================================');

const declaredModels = [
  "corpus.font_manifest", "corpus.waqaf_rule", "corpus.alignment_pair",
  "search.thematic_node", "search.semantic_edge", "corpus.ayah_proof",
  "corpus.reciter", "corpus.audio_segment", "chat.message_citation",
  "ai.provider_mesh_config", "ai.endpoint_telemetry", "corpus.root_word",
  "corpus.word_derivation", "research.syntax_segment", "ai.client_preference",
  "auth.atmosphere_preference", "telemetry.region_node", "auth.chime_preference",
  "auth.sanctuary_preference", "auth.density_preference", "workflow.covenant_signature",
  "workflow.peer_review", "community.study_circle", "community.circle_reflection",
  "community.beneficial_deed", "telemetry.metric_snapshot", "i18n.catalog_sync_log",
  "auth.command_history", "studio.export_job", "corpus.offline_manifest",
  "base.movement_engagement", "system.type_hardening_log", "system.bundle_size_log",
  "workflow.transition_audit", "system.e2e_run_record"
];

const missingAcl = [];
declaredModels.forEach(m => {
  if (!modelsWithAcl.has(m)) {
    missingAcl.push(m);
  }
});

console.log(`Models declared: ${declaredModels.length}`);
console.log(`Models with ACL defined: ${modelsWithAcl.size}`);
console.log(`Models MISSING ACL in plan: ${missingAcl.length}`);
missingAcl.forEach(m => console.log(`  ⚠️ Missing ACL: ${m}`));
