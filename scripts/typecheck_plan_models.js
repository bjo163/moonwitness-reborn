const fs = require('fs');
const ts = require('typescript');

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf8');

// Extract all typescript code blocks
const codeBlockRegex = /```typescript([\s\S]*?)```/g;
let match;
const blocks = [];
while ((match = codeBlockRegex.exec(content)) !== null) {
  blocks.push(match[1]);
}

// Find all model definitions and const array declarations
const modelDecls = [];
const constDecls = [];

blocks.forEach(block => {
  const sf = ts.createSourceFile('block.ts', block, ts.ScriptTarget.Latest, true);
  sf.forEachChild(node => {
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        const text = decl.getText(sf);
        const typeText = decl.type ? decl.type.getText(sf) : '';
        if (typeText.includes('QlModelDefinition')) {
          modelDecls.push(decl.getText(sf));
        } else if (text.includes('as const') || decl.name.text.toUpperCase() === decl.name.text) {
          constDecls.push(node.getText(sf));
        }
      });
    }
  });
});

console.log(`Extracted ${constDecls.length} const declarations and ${modelDecls.length} model declarations.`);

const testSource = `
import type { QlModelDefinition } from "./packages/ql-orm/src/index";

${constDecls.join('\n')}

${modelDecls.map(d => `export const ${d};`).join('\n\n')}
`;

const options = {
  noEmit: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  strict: true,
  skipLibCheck: true
};

const host = ts.createCompilerHost(options);
const originalGetSourceFile = host.getSourceFile;
host.getSourceFile = (fileName, languageVersion) => {
  if (fileName === 'test_models.ts') {
    return ts.createSourceFile(fileName, testSource, languageVersion);
  }
  return originalGetSourceFile(fileName, languageVersion);
};

const program = ts.createProgram(['test_models.ts'], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);

const fileDiagnostics = diagnostics.filter(d => d.file && d.file.fileName === 'test_models.ts');

console.log(`\n========================================`);
console.log(`TYPECHECK DIAGNOSTICS FOR QL_ORM MODELS (${fileDiagnostics.length} errors):`);
console.log(`========================================`);

fileDiagnostics.forEach(d => {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.log(`Line ${line + 1}:${character + 1} - ${message}`);
});
