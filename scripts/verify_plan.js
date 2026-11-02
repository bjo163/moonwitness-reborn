const fs = require('fs');
const ts = require('typescript');

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf8');

// 1. Extract all typescript code blocks
const codeBlockRegex = /```typescript([\s\S]*?)```/g;
let match;
let allTs = '';
let blockIndex = 0;
const codeBlocks = [];

while ((match = codeBlockRegex.exec(content)) !== null) {
  blockIndex++;
  codeBlocks.push({ block: blockIndex, code: match[1], index: match.index });
  allTs += `\n// --- BLOCK ${blockIndex} ---\n` + match[1];
}

console.log(`Extracted ${codeBlocks.length} TypeScript code blocks.`);

const sourceFile = ts.createSourceFile('plan.ts', allTs, ts.ScriptTarget.Latest, true);

function parseObject(node) {
  const obj = {};
  node.properties.forEach(prop => {
    if (ts.isPropertyAssignment(prop)) {
      const name = prop.name.getText(sourceFile).replace(/['"]/g, '');
      if (ts.isStringLiteral(prop.initializer)) {
        obj[name] = prop.initializer.text;
      } else if (ts.isNumericLiteral(prop.initializer)) {
        obj[name] = Number(prop.initializer.text);
      } else if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
        obj[name] = true;
      } else if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
        obj[name] = false;
      } else if (ts.isObjectLiteralExpression(prop.initializer)) {
        obj[name] = parseObject(prop.initializer);
      } else if (ts.isArrayLiteralExpression(prop.initializer)) {
        obj[name] = prop.initializer.elements.map(e => e.getText(sourceFile).replace(/['"]/g, ''));
      } else {
        obj[name] = prop.initializer.getText(sourceFile);
      }
    }
  });
  return obj;
}

const models = [];
sourceFile.forEachChild(node => {
  if (ts.isVariableStatement(node)) {
    node.declarationList.declarations.forEach(decl => {
      const typeText = decl.type ? decl.type.getText(sourceFile) : '';
      if (typeText.includes('QlModelDefinition') && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        models.push({
          varName: decl.name.getText(sourceFile),
          model: parseObject(decl.initializer)
        });
      }
    });
  }
});

console.log(`Found ${models.length} declared QlModelDefinition models.`);

const ALLOWED_FIELD_TYPES = new Set(['char', 'text', 'integer', 'boolean', 'datetime']);

const findings = {
  forbiddenId: [],
  invalidTypes: [],
  invalidModelNames: [],
  invalidTableNames: [],
  ownerFieldIssues: [],
  privateFieldAnalysis: [],
  allModels: []
};

models.forEach((m) => {
  const mod = m.model;
  const fields = mod.fields || {};
  const fieldNames = Object.keys(fields);
  
  const modelSummary = {
    varName: m.varName,
    name: mod.name,
    tableName: mod.tableName,
    ownerField: mod.ownerField || null,
    fieldCount: fieldNames.length,
    privateFields: [],
    fields: {}
  };

  // Check 1: 'id' field in fields
  if (fields['id']) {
    findings.forbiddenId.push({
      varName: m.varName,
      modelName: mod.name,
      fieldDef: fields['id']
    });
  }

  // Check 2: Model name naming convention (domain.entity)
  if (!mod.name || !/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(mod.name)) {
    findings.invalidModelNames.push({
      varName: m.varName,
      modelName: mod.name
    });
  }

  // Check 3: Table name convention
  if (!mod.tableName || !/^[a-z][a-z0-9_]*$/.test(mod.tableName)) {
    findings.invalidTableNames.push({
      varName: m.varName,
      tableName: mod.tableName
    });
  }

  // Check 4: Field types & constraints
  for (const fName of fieldNames) {
    const fDef = fields[fName];
    if (typeof fDef === 'object' && fDef !== null) {
      modelSummary.fields[fName] = {
        type: fDef.type,
        required: !!fDef.required,
        private: !!fDef.private,
        unique: !!fDef.unique,
        default: fDef.default
      };

      if (fDef.private) {
        modelSummary.privateFields.push(fName);
      }

      if (!ALLOWED_FIELD_TYPES.has(fDef.type)) {
        findings.invalidTypes.push({
          varName: m.varName,
          modelName: mod.name,
          field: fName,
          type: fDef.type
        });
      }
    }
  }

  // Check 5: ownerField compliance
  if (mod.ownerField) {
    const ofDef = fields[mod.ownerField];
    if (!ofDef) {
      findings.ownerFieldIssues.push({
        varName: m.varName,
        modelName: mod.name,
        issue: `ownerField '${mod.ownerField}' is not defined in fields`
      });
    } else {
      if (ofDef.type !== 'char') {
        findings.ownerFieldIssues.push({
          varName: m.varName,
          modelName: mod.name,
          issue: `ownerField '${mod.ownerField}' has type '${ofDef.type}' instead of 'char'`
        });
      }
      if (!ofDef.required) {
        findings.ownerFieldIssues.push({
          varName: m.varName,
          modelName: mod.name,
          issue: `ownerField '${mod.ownerField}' is missing required: true`
        });
      }
      if (!ofDef.private) {
        findings.privateFieldAnalysis.push({
          varName: m.varName,
          modelName: mod.name,
          field: mod.ownerField,
          note: `ownerField '${mod.ownerField}' is NOT marked private: true`
        });
      }
    }
  }

  findings.allModels.push(modelSummary);
});

console.log('\n========================================');
console.log('RESULTS OF QL_ORM SCHEMA VALIDATION:');
console.log('========================================');

console.log(`\n1. FORBIDDEN 'id' FIELDS (Count: ${findings.forbiddenId.length}):`);
if (findings.forbiddenId.length === 0) {
  console.log('  None! No model declares an explicit "id" in fields (passes QlOrm requirement).');
} else {
  findings.forbiddenId.forEach(f => console.log(`  ❌ ${f.varName} (${f.modelName}): declares forbidden id field:`, f.fieldDef));
}

console.log(`\n2. INVALID FIELD TYPES (Count: ${findings.invalidTypes.length}):`);
if (findings.invalidTypes.length === 0) {
  console.log('  None! All fields use permitted types: char, text, integer, boolean, datetime.');
} else {
  findings.invalidTypes.forEach(f => console.log(`  ❌ ${f.varName} (${f.modelName}): field '${f.field}' has invalid type '${f.type}'`));
}

console.log(`\n3. INVALID MODEL NAMES (Count: ${findings.invalidModelNames.length}):`);
if (findings.invalidModelNames.length === 0) {
  console.log('  None! All models conform to "domain.entity" regex.');
} else {
  findings.invalidModelNames.forEach(f => console.log(`  ❌ ${f.varName}: invalid name '${f.modelName}'`));
}

console.log(`\n4. INVALID TABLE NAMES (Count: ${findings.invalidTableNames.length}):`);
if (findings.invalidTableNames.length === 0) {
  console.log('  None! All tableNames conform to identifier regex.');
} else {
  findings.invalidTableNames.forEach(f => console.log(`  ❌ ${f.varName}: invalid tableName '${f.tableName}'`));
}

console.log(`\n5. OWNER_FIELD COMPLIANCE ISSUES (Count: ${findings.ownerFieldIssues.length}):`);
if (findings.ownerFieldIssues.length === 0) {
  console.log('  None! All declared ownerFields exist, are char, and are required: true.');
} else {
  findings.ownerFieldIssues.forEach(f => console.log(`  ❌ ${f.varName} (${f.modelName}): ${f.issue}`));
}

console.log(`\n6. MODELS WITH OWNER_FIELD (Multi-tenant scoped models):`);
const tenantModels = findings.allModels.filter(m => m.ownerField);
tenantModels.forEach(m => {
  console.log(`  - ${m.name} (table: ${m.tableName}, ownerField: ${m.ownerField}, privateFields: [${m.privateFields.join(', ')}])`);
});

console.log(`\n7. MODELS WITHOUT OWNER_FIELD (Global/system/shared models):`);
const globalModels = findings.allModels.filter(m => !m.ownerField);
globalModels.forEach(m => {
  console.log(`  - ${m.name} (table: ${m.tableName}, privateFields: [${m.privateFields.join(', ')}])`);
});
