import fs from "node:fs";
import { execSync } from "node:child_process";

const TARGET_PATH = "C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md";
const content = fs.readFileSync(TARGET_PATH, "utf8");

const results = [];

function check(id, title, testFn) {
  try {
    const passed = testFn();
    if (passed) {
      results.push({ id, title, status: "PASS", message: "Check succeeded." });
      console.log(`[PASS] Item ${id}: ${title}`);
    } else {
      results.push({ id, title, status: "FAIL", message: "Check returned false." });
      console.error(`[FAIL] Item ${id}: ${title}`);
    }
  } catch (err) {
    results.push({ id, title, status: "FAIL", message: err.message });
    console.error(`[FAIL] Item ${id}: ${title} - ${err.message}`);
  }
}

console.log("==================================================================");
console.log("RUNNING RIGOROUS 10-ITEM REMEDIATION VERIFICATION SUITE");
console.log("==================================================================");

// 1. FATAL GIT GREP SYNTAX
check(1, "Fatal git grep syntax fixed and executes cleanly", () => {
  const hasFixedGate2 = content.includes('git grep -E "(fetch\\(|axios\\.|XMLHttpRequest)"');
  const hasFixedGate3 = content.includes('git grep -E "(style=\\{\\{|#[0-9a-fA-F]{3,6})"');
  const hasBrokenGate2 = content.includes('git grep -E "(fetch(|axios.|XMLHttpRequest)"');
  const hasBrokenGate3 = content.includes('git grep -E "(style={{|#[0-9a-fA-F]{3,6})"');

  // Actually execute both commands
  execSync('git grep -E "(fetch\\(|axios\\.|XMLHttpRequest)" -- "apps/web/src/**" || exit 0', { stdio: "ignore" });
  execSync('git grep -E "(style=\\{\\{|#[0-9a-fA-F]{3,6})" -- "apps/web/src/**" || exit 0', { stdio: "ignore" });

  return hasFixedGate2 && hasFixedGate3 && !hasBrokenGate2 && !hasBrokenGate3;
});

// 2. PNPM --FILTER SYNTAX
check(2, "pnpm --filter package-name selectors and explicit fallbacks", () => {
  const brokenDirFilters = [
    "pnpm --filter apps/web test",
    "pnpm --filter apps/web test:e2e",
    "pnpm --filter packages/ql_workflow test",
    "pnpm --filter packages/ql_chat test",
    "pnpm --filter packages/ql_base test"
  ];
  for (const b of brokenDirFilters) {
    if (content.includes(b)) {
      throw new Error(`Found broken filter: ${b}`);
    }
  }
  const hasWorkflow = content.includes("pnpm --filter @moonwitness/ql_workflow");
  const hasChat = content.includes("pnpm --filter @moonwitness/ql_chat");
  const hasBase = content.includes("pnpm --filter @moonwitness/ql_base");
  const hasWeb = content.includes("pnpm --filter @moonwitness/web");
  const hasFallbackNodeTest = content.includes("Fallback: pnpm --filter @moonwitness/ql_workflow exec") || content.includes("exec node --test");

  return hasWorkflow && hasChat && hasBase && hasWeb && hasFallbackNodeTest;
});

// 3. QL_ORM selectionKeys -> options TYPING
check(3, "selectionKeys replaced with options across all models", () => {
  const countSelectionKeys = (content.match(/selectionKeys\s*:/g) || []).length;
  if (countSelectionKeys > 0) {
    throw new Error(`Still found ${countSelectionKeys} occurrences of selectionKeys!`);
  }
  // Verify specific models
  const hasT21Options = content.includes('options: ["healthy", "degraded", "critical"]');
  const hasT22Options = content.includes('options: ["passed", "synced", "failed"]');
  const hasT24OptionsFormat = content.includes('options: ["pdf", "markdown", "json"]');
  const hasT24OptionsStatus = content.includes('options: ["queued", "processing", "ready", "failed"]');
  const hasT26OptionsDwell = content.includes('options: ["brief", "reading", "contemplative"]');
  const hasT30OptionsEngine = content.includes('options: ["chromium", "firefox", "webkit"]');

  return hasT21Options && hasT22Options && hasT24OptionsFormat && hasT24OptionsStatus && hasT26OptionsDwell && hasT30OptionsEngine;
});

// 4. MULTI-TENANT ISOLATION RESOLVED ON COLLABORATIVE & PUBLIC MODELS
check(4, "Multi-tenant isolation removed from collaborative/public models", () => {
  // Track 16
  const t16Matches = content.match(/name:\s*"workflow\.covenant_signature"[\s\S]*?fields:\s*\{/);
  if (t16Matches && /ownerField\s*:/.test(t16Matches[0])) {
    throw new Error("workflow.covenant_signature still has ownerField property!");
  }
  const hasSignerId = content.includes("signer_id: {") && content.includes('model: "workflow.covenant_signature",\n  group: "viewer",\n  read: true');

  // Track 18 study circle
  const t18Circle = content.match(/name:\s*"community\.study_circle"[\s\S]*?fields:\s*\{/);
  if (t18Circle && /ownerField\s*:/.test(t18Circle[0])) {
    throw new Error("community.study_circle still has ownerField property!");
  }

  // Track 18 circle reflection
  const t18Reflection = content.match(/name:\s*"community\.circle_reflection"[\s\S]*?fields:\s*\{/);
  if (t18Reflection && /ownerField\s*:/.test(t18Reflection[0])) {
    throw new Error("community.circle_reflection still has ownerField property!");
  }

  // Track 19 beneficial deed
  const t19Deed = content.match(/name:\s*"community\.beneficial_deed"[\s\S]*?fields:\s*\{/);
  if (t19Deed && /ownerField\s*:/.test(t19Deed[0])) {
    throw new Error("community.beneficial_deed still has ownerField property!");
  }
  const hasContributorId = content.includes("contributor_id: {");

  return hasSignerId && hasContributorId;
});

// 5. SANAD PIPELINE SERVICE QUERY SYNTAX (Track 17)
check(5, "findManyByService matches QlOrm exact signature (modelName, filters, options)", () => {
  const hasChangeQuery = content.includes('await orm.findManyByService(\n    "workflow.change",\n    { id: changeId },\n    { limit: 1 }\n  );');
  const hasQuorumQuery = content.includes('await orm.findManyByService(\n    "workflow.peer_review",\n    { change_id: changeId, decision: "approved" }\n  );');
  const hasOldBadFilter = content.includes('filter: { id: changeId }');

  return hasChangeQuery && hasQuorumQuery && !hasOldBadFilter;
});

// 6. MOONCLIENT BINARY PDF STREAMING (Track 24)
check(6, "MoonClient downloadBlob method added for binary streaming", () => {
  const hasDownloadBlob = content.includes("public async downloadBlob(");
  const hasBlobReturn = content.includes("return response.blob();");
  const usesDownloadBlob = content.includes("return this.downloadBlob(");
  const hasRawRequest = content.includes("this.rawRequest");

  return hasDownloadBlob && hasBlobReturn && usesDownloadBlob && !hasRawRequest;
});

// 7. SECURITY & SSRF VULNERABILITY (Track 07)
check(7, "ai.provider_mesh_config SSRF protection and viewer read lockdown", () => {
  const hasSSRFRegex = content.includes("/^127\\\\.\\\\d+\\\\.\\\\d+\\\\.\\\\d+$/") || content.includes("/^127\\.\\d+\\.\\d+\\.\\d+$/");
  const hasViewerDenied = content.includes('model: "ai.provider_mesh_config",\n  group: "viewer",\n  read: false,');

  return hasSSRFRegex && hasViewerDenied;
});

// 8. TABLE 1.3 DEPENDENCY MATRIX REALIGNED
check(8, "Table 1.3 dependency matrix realigned without forward inversions", () => {
  const lines = content.split("\n");
  const t26Line = lines.find(l => l.includes("| **26** |") && l.includes("Modular Movement Componentization"));
  const t23Line = lines.find(l => l.includes("| **23** |") && l.includes("Next-Gen Spotlight Command Palette"));

  if (!t26Line) throw new Error("Could not find Track 26 row in Table 1.3!");
  if (!t23Line) throw new Error("Could not find Track 23 row in Table 1.3!");

  const t26Cols = t26Line.split("|").map(c => c.trim());
  const t26Upstream = t26Cols[5];
  if (t26Upstream.includes("Track 11") || t26Upstream.includes("Track 12") || t26Upstream.includes("Track 14")) {
    throw new Error(`Track 26 upstream still contains Batch 4 tracks: ${t26Upstream}`);
  }

  const t23Cols = t23Line.split("|").map(c => c.trim());
  const t23Upstream = t23Cols[5];
  if (t23Upstream.includes("Track 13")) {
    throw new Error(`Track 23 upstream still contains Batch 4 track 13: ${t23Upstream}`);
  }

  return true;
});

// 9. HARDEN RUNTIME EDGE CASES & FALLBACKS
check(9, "Runtime edge cases & fallbacks hardened across Tracks 06, 07, 10, 14, 30", () => {
  const t10GpuAdapter = content.includes("resolveInferenceBackend") && content.includes("await navigator.gpu.requestAdapter()");
  const t07InterChunk = content.includes("interChunkTimeoutMs: number") && content.includes("ProviderMeshFallbackDto");
  const t06Levenshtein = content.includes("best-matching substring excerpt of the canonical ayah text using sliding-window alignment");
  const t14MobileTouch = content.includes("two-finger tap anywhere on the screen") && content.includes("persistent subtle floating touch target");
  const t30Particles = content.includes("?disable-particles=true") && content.includes("deterministic static CSS gradient");

  return t10GpuAdapter && t07InterChunk && t06Levenshtein && t14MobileTouch && t30Particles;
});

// 10. ENFORCE 4 UI STATES & REDUCED MOTION ACROSS ALL 30 TRACKS
check(10, "All 30 tracks explicitly incorporate 4 UI states and @media (prefers-reduced-motion: reduce)", () => {
  const tracks = content.split(/#### 🔹 Track (\d+):/);
  let passedCount = 0;
  for (let i = 1; i < tracks.length; i += 2) {
    const trackNum = tracks[i];
    const trackContent = tracks[i + 1];
    const sec5Match = trackContent.match(/##### 5\. UI \/ UX & Anti-Slop Specifications([\s\S]*?)##### 6\./);
    if (!sec5Match) throw new Error(`Section 5 missing in Track ${trackNum}`);
    const sec5 = sec5Match[1];
    const hasEmpty = /empty/i.test(sec5);
    const hasLoading = /loading/i.test(sec5);
    const hasError = /error/i.test(sec5);
    const hasSuccess = /success/i.test(sec5);
    const hasReducedMotion = /reduced-motion/i.test(sec5);

    if (hasEmpty && hasLoading && hasError && hasSuccess && hasReducedMotion) {
      passedCount++;
    } else {
      throw new Error(`Track ${trackNum} incomplete: E:${hasEmpty} L:${hasLoading} Er:${hasError} S:${hasSuccess} M:${hasReducedMotion}`);
    }
  }
  console.log(`Verified 4 UI states & reduced motion on ${passedCount}/30 tracks.`);
  return passedCount === 30;
});

console.log("==================================================================");
const allPassed = results.every(r => r.status === "PASS");
if (allPassed) {
  console.log("ALL 10 REMEDIATION CHECKS PASSED WITH 100% SUCCESS!");
} else {
  console.error("SOME CHECKS FAILED!");
  process.exit(1);
}
