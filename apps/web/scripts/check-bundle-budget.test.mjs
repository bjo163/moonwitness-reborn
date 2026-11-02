import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  assertBundleBudgetBuildUnchanged,
  recordBundleBudgetBuild,
} from "./bundle-budget-artifact.mjs";

async function createBuildFixture() {
  const root = await mkdtemp(join(tmpdir(), "mw-bundle-budget-"));
  const distDir = join(root, ".next");
  const chunkPath = join(distDir, "static", "chunks", "app.js");
  await mkdir(join(distDir, "static", "chunks"), { recursive: true });
  await writeFile(join(distDir, "BUILD_ID"), "fresh-build-id");
  await writeFile(join(distDir, "required-server-files.json"), "{}");
  await writeFile(
    join(distDir, "app-build-manifest.json"),
    JSON.stringify({
      pages: { "/page": ["static/chunks/app.js"] },
      rootFiles: [],
    }),
  );
  await writeFile(chunkPath, "window.app = true;");
  return { root, distDir, chunkPath };
}

void test("bundle budget snapshots accept fresh generated build IDs", async () => {
  const fixture = await createBuildFixture();
  try {
    await recordBundleBudgetBuild(fixture.distDir);
    assert.doesNotThrow(() =>
      assertBundleBudgetBuildUnchanged(fixture.distDir),
    );

    await writeFile(join(fixture.distDir, "BUILD_ID"), "another-build-id");
    await recordBundleBudgetBuild(fixture.distDir);
    assert.doesNotThrow(() =>
      assertBundleBudgetBuildUnchanged(fixture.distDir),
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

void test("bundle budget snapshots reject assets changed after the build", async () => {
  const fixture = await createBuildFixture();
  try {
    await recordBundleBudgetBuild(fixture.distDir);
    await writeFile(fixture.chunkPath, "window.app = false;");

    assert.throws(
      () => assertBundleBudgetBuildUnchanged(fixture.distDir),
      /Production build output changed after its bundle-budget snapshot/,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

void test("bundle budget snapshots reject missing production chunks", async () => {
  const fixture = await createBuildFixture();
  try {
    await recordBundleBudgetBuild(fixture.distDir);
    await rm(fixture.chunkPath);

    assert.throws(
      () => assertBundleBudgetBuildUnchanged(fixture.distDir),
      /Production build is missing JS chunk 'static\/chunks\/app\.js'/,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

void test("bundle budget snapshots require a prior production build marker", async () => {
  const fixture = await createBuildFixture();
  try {
    assert.throws(
      () => assertBundleBudgetBuildUnchanged(fixture.distDir),
      /No bundle-budget build snapshot found/,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
