const fs = require('fs');

const targetPath = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(targetPath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('=== QLORM MODELS DEEP AUDIT ===');

let models = [];
let currentModel = null;

lines.forEach((l, idx) => {
  if (l.includes('export const ') && (l.includes('Model:') || l.includes('Model =') || l.includes('Definition: QlModelDefinition'))) {
    currentModel = {
      line: idx + 1,
      header: l.trim(),
      fields: [],
      hasAcl: false,
      tableName: null
    };
    models.push(currentModel);
  } else if (currentModel) {
    if (l.includes('name:') || l.includes('model:')) {
      const match = l.match(/['"]([a-z0-9_]+\.[a-z0-9_]+)['"]/);
      if (match) currentModel.tableName = match[1];
    }
    if (l.includes('fields:')) {
      currentModel.hasFields = true;
    }
    if (l.includes('type: "') || l.includes("type: '")) {
      const typeMatch = l.match(/type:\s*['"]([a-z0-9_]+)['"]/);
      if (typeMatch) currentModel.fields.push(typeMatch[1]);
    }
    if (l.includes('accessRules') || l.includes('acl:') || l.includes('AccessRules')) {
      currentModel.hasAcl = true;
    }
    if (l.startsWith('##### ') || l.startsWith('#### ')) {
      currentModel = null;
    }
  }
});

console.log(`Found ${models.length} model declarations in the artifact:`);
let issues = [];

models.forEach((m, idx) => {
  console.log(`Model ${idx + 1} (Line ${m.line}): ${m.header} | table: ${m.tableName} | fields: ${m.fields.length}`);
  if (m.fields.length === 0) {
    issues.push(`Model at line ${m.line} (${m.header}) has 0 parsed fields!`);
  }
  if (!m.tableName) {
    issues.push(`Model at line ${m.line} has no domain.entity model name!`);
  }
});

console.log(`Model validation issues: ${issues.length}`);
issues.forEach(i => console.error('  FAIL: ' + i));
