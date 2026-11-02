import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf-8');

// Regex for all 35 model definitions
const modelRegex = /export\s+const\s+([A-Za-z0-9_]+)\s*:\s*QlModelDefinition\s*=\s*\{([\s\S]*?)\n\};/g;

let mMatch;
const models = [];
const allowedTypes = new Set(['char', 'text', 'integer', 'boolean', 'datetime']);

while ((mMatch = modelRegex.exec(content)) !== null) {
  const varName = mMatch[1];
  const body = mMatch[2];

  const nameMatch = body.match(/name:\s*["']([^"']+)["']/);
  const tableMatch = body.match(/tableName:\s*["']([^"']+)["']/);
  const ownerFieldMatch = body.match(/ownerField:\s*["']([^"']+)["']/);

  // Parse fields
  const fields = [];
  const fieldsMatch = body.match(/fields:\s*\{([\s\S]*?)\n\s*\},/);
  if (fieldsMatch) {
    const fBlock = fieldsMatch[1];
    const fieldLines = fBlock.split('\n');
    let currentField = null;
    fieldLines.forEach(l => {
      const fnMatch = l.match(/^\s*([a-z0-9_]+):\s*\{/);
      if (fnMatch) {
        currentField = { name: fnMatch[1], type: null, isPrivate: false, isRequired: false };
        fields.push(currentField);
      }
      if (currentField) {
        const typeMatch = l.match(/type:\s*["']([^"']+)["']/);
        if (typeMatch) currentField.type = typeMatch[1];
        if (/private:\s*true/.test(l)) currentField.isPrivate = true;
        if (/required:\s*true/.test(l)) currentField.isRequired = true;
      }
    });
  }

  // Parse accessRules
  const accessRules = [];
  const arMatch = body.match(/accessRules:\s*\[([\s\S]*?)\]/);
  if (arMatch) {
    const rLines = arMatch[1].split('\n');
    rLines.forEach(l => {
      const gMatch = l.match(/group:\s*["']([^"']+)["']/);
      if (gMatch) {
        const r = /read:\s*(true|false)/.exec(l)?.[1] === 'true';
        const w = /write:\s*(true|false)/.exec(l)?.[1] === 'true';
        const c = /create:\s*(true|false)/.exec(l)?.[1] === 'true';
        const u = /unlink:\s*(true|false)/.exec(l)?.[1] === 'true';
        accessRules.push({ group: gMatch[1], read: r, write: w, create: c, unlink: u });
      }
    });
  }

  models.push({
    varName,
    name: nameMatch ? nameMatch[1] : 'UNKNOWN',
    tableName: tableMatch ? tableMatch[1] : 'UNKNOWN',
    ownerField: ownerFieldMatch ? ownerFieldMatch[1] : null,
    fields,
    accessRules
  });
}

console.log(`=== FULL 35 MODEL AUDIT ===`);
console.log(`Total parsed models: ${models.length}`);

const namingErrors = [];
const typeErrors = [];
const modelsWithMissingFields = [];

models.forEach(m => {
  if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(m.name)) {
    namingErrors.push(m.name);
  }
  if (m.fields.length === 0) {
    modelsWithMissingFields.push(m.name);
  }
  m.fields.forEach(f => {
    if (!allowedTypes.has(f.type)) {
      typeErrors.push({ model: m.name, field: f.name, type: f.type });
    }
  });
});

console.log(`Naming errors (not domain.entity): ${namingErrors.length}`);
console.log(`Models with missing fields: ${modelsWithMissingFields.length}`);
console.log(`Field type errors: ${typeErrors.length}`);
if (typeErrors.length > 0) {
  console.log(JSON.stringify(typeErrors, null, 2));
}

console.log('\n--- Field Summary ---');
console.log(`Total fields across all models: ${models.reduce((acc, m) => acc + m.fields.length, 0)}`);

const privateFields = [];
models.forEach(m => {
  m.fields.filter(f => f.isPrivate).forEach(f => {
    privateFields.push(`${m.name}.${f.name}`);
  });
});
console.log(`Private fields (${privateFields.length}):`, privateFields);

const ownerModels = models.filter(m => m.ownerField);
console.log(`Models with ownerField (${ownerModels.length}):`, ownerModels.map(m => `${m.name} -> ${m.ownerField}`));

// Check access rules
console.log('\n--- Access Rules & Deny-by-Default Audit ---');
const modelsWithoutRules = models.filter(m => m.accessRules.length === 0);
console.log(`Models with embedded accessRules: ${models.length - modelsWithoutRules.length} / ${models.length}`);

// Some models have separate accessRules arrays (e.g. export const ...AccessRules = [...])
// Let's check how many models have separate accessRules in the file
const separateRuleMatches = content.match(/export\s+const\s+[A-Za-z0-9_]+AccessRules\s*=\s*\[/g) || [];
console.log(`Separate export const ...AccessRules arrays: ${separateRuleMatches.length}`);
