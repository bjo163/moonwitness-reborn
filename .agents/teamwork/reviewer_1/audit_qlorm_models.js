import fs from 'node:fs';

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf-8');

// Regex to capture QlModelDefinition objects
// Models are declared like:
// export const ...Model: QlModelDefinition = {
//   name: "domain.entity",
//   tableName: "domain_entity",
//   ...
// };
const modelBlockRegex = /export\s+const\s+([A-Za-z0-9_]+Model)\s*:\s*QlModelDefinition\s*=\s*\{([\s\S]*?)\n\};/g;

let modelMatch;
const models = [];
const allowedTypes = new Set(['char', 'text', 'integer', 'boolean', 'datetime']);

while ((modelMatch = modelBlockRegex.exec(content)) !== null) {
  const varName = modelMatch[1];
  const body = modelMatch[2];

  const nameMatch = body.match(/name:\s*["']([^"']+)["']/);
  const tableMatch = body.match(/tableName:\s*["']([^"']+)["']/);
  const ownerFieldMatch = body.match(/ownerField:\s*["']([^"']+)["']/);

  // Parse fields
  const fieldsBlockMatch = body.match(/fields:\s*\{([\s\S]*?)\n\s*\},/);
  const fields = [];
  if (fieldsBlockMatch) {
    const fBlock = fieldsBlockMatch[1];
    const fieldDeclRegex = /([a-z0-9_]+):\s*\{([^}]*)\}/g;
    let fMatch;
    while ((fMatch = fieldDeclRegex.exec(fBlock)) !== null) {
      const fName = fMatch[1];
      const fContent = fMatch[2];
      const typeMatch = fContent.match(/type:\s*["']([^"']+)["']/);
      const isPrivate = /private:\s*true/.test(fContent);
      const isRequired = /required:\s*true/.test(fContent);
      fields.push({
        name: fName,
        type: typeMatch ? typeMatch[1] : 'UNKNOWN',
        isPrivate,
        isRequired
      });
    }
  }

  models.push({
    varName,
    name: nameMatch ? nameMatch[1] : 'UNKNOWN',
    tableName: tableMatch ? tableMatch[1] : 'UNKNOWN',
    ownerField: ownerFieldMatch ? ownerFieldMatch[1] : null,
    fields
  });
}

console.log(`=== QLORM MODELS AUDIT ===`);
console.log(`Total QlModelDefinition objects found: ${models.length}`);

const invalidTypesFound = [];
const namingViolations = [];

models.forEach(m => {
  // Check domain.entity naming format
  if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(m.name)) {
    namingViolations.push({ model: m.name, reason: 'Invalid format (not domain.entity)' });
  }

  // Check fields
  m.fields.forEach(f => {
    if (!allowedTypes.has(f.type)) {
      invalidTypesFound.push({ model: m.name, field: f.name, type: f.type });
    }
  });
});

console.log(`Model naming violations: ${namingViolations.length}`);
if (namingViolations.length > 0) console.log(namingViolations);

console.log(`Invalid field types: ${invalidTypesFound.length}`);
if (invalidTypesFound.length > 0) console.log(invalidTypesFound);

console.log('\nModels with ownerField:');
models.filter(m => m.ownerField).forEach(m => {
  console.log(`  - ${m.name} -> ownerField: "${m.ownerField}"`);
});

console.log('\nModels with private fields:');
models.forEach(m => {
  const privateFields = m.fields.filter(f => f.isPrivate);
  if (privateFields.length > 0) {
    console.log(`  - ${m.name}: ${privateFields.map(f => f.name).join(', ')}`);
  }
});
