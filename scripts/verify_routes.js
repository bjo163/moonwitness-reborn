const fs = require('fs');

const PLAN_PATH = 'C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md';
const content = fs.readFileSync(PLAN_PATH, 'utf8');

// Find all apiRoutes occurrences and extract their blocks
const apiRoutesRegex = /export const apiRoutes\s*=\s*\{([\s\S]*?)\}\s*as const;/g;
let match;
let count = 0;
const allRoutes = [];

while ((match = apiRoutesRegex.exec(content)) !== null) {
  count++;
  allRoutes.push({ index: count, text: match[1] });
}

console.log(`Found ${allRoutes.length} apiRoutes declarations in plan.`);

// Also extract all route function signatures or string templates
// Examples:
// item: (id: string) => `/path/${...}`
// or this.request(...)

const routeFnRegex = /(\w+)\s*:\s*\(([^)]*)\)\s*=>\s*`([^`]+)`/g;
const routeFns = [];
while ((match = routeFnRegex.exec(content)) !== null) {
  routeFns.push({
    name: match[1],
    params: match[2],
    template: match[3]
  });
}

console.log(`Found ${routeFns.length} parameterized route arrow functions in plan.`);

// Analyze each route function for parameter encoding:
const encodingIssues = [];
routeFns.forEach(fn => {
  // Check expressions inside ${...}
  const interpolations = [];
  const interpRegex = /\$\{([^}]+)\}/g;
  let im;
  while ((im = interpRegex.exec(fn.template)) !== null) {
    interpolations.push(im[1].trim());
  }

  const paramNames = fn.params.split(',').map(p => p.split(':')[0].trim()).filter(Boolean);

  interpolations.forEach(expr => {
    // Check if expr properly encodes the parameter
    const isEncoded = expr.startsWith('encodeURIComponent(') || expr.startsWith('segment(');
    if (!isEncoded) {
      encodingIssues.push({
        fnName: fn.name,
        params: fn.params,
        template: fn.template,
        expression: expr,
        issue: 'Unencoded parameter interpolation!'
      });
    }
  });
});

console.log(`\n========================================`);
console.log(`PARAMETER ENCODING ANALYSIS (${encodingIssues.length} issues):`);
console.log(`========================================`);

if (encodingIssues.length === 0) {
  console.log('All parameterized route functions use encodeURIComponent or segment().');
} else {
  encodingIssues.forEach(iss => {
    console.log(`❌ ${iss.fnName}(${iss.params}): ${iss.template}`);
    console.log(`   Unencoded expression: \${${iss.expression}}`);
  });
}

// Now let's also check all this.request calls in MoonClient across all tracks
console.log(`\n========================================`);
console.log(`CHECKING DIRECT this.request(...) CALLS:`);
console.log(`========================================`);

const reqRegex = /this\.request[^(]*\(([^,\n)]+)/g;
const directUrls = [];
while ((match = reqRegex.exec(content)) !== null) {
  const urlArg = match[1].trim();
  if (urlArg.startsWith('`')) {
    directUrls.push(urlArg);
  }
}

console.log(`Found ${directUrls.length} template literal URLs in this.request:`);
directUrls.forEach(url => {
  console.log(` - ${url}`);
  const interpRegex = /\$\{([^}]+)\}/g;
  let im;
  while ((im = interpRegex.exec(url)) !== null) {
    const expr = im[1].trim();
    if (!expr.startsWith('encodeURIComponent(') && !expr.startsWith('segment(') && !expr.startsWith('apiRoutes') && !expr.includes('query')) {
      console.log(`   ⚠️ Potential unencoded parameter in request: \${${expr}}`);
    }
  }
});

console.log('\n========================================');
console.log('ALL API ROUTES DECLARED IN PLAN:');
console.log('========================================');

const rRegex = /export const apiRoutes\s*=\s*\{([\s\S]*?)\}\s*as const;/g;
let rm;
let rIdx = 0;
while ((rm = rRegex.exec(content)) !== null) {
  rIdx++;
  console.log(`\n--- Block ${rIdx} ---`);
  console.log(rm[1].trim());
}
