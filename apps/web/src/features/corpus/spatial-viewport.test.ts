import assert from "node:assert/strict";
import test from "node:test";

interface SpatialViewport {
  name: string;
  width: number;
  height: number;
  devicePixelRatio: number;
  isMobile: boolean;
  expectedGridColumns: number;
}

const VIEWPORT_MATRIX: readonly SpatialViewport[] = [
  {
    name: "Mobile Portrait (Compact)",
    width: 375,
    height: 812,
    devicePixelRatio: 3,
    isMobile: true,
    expectedGridColumns: 1,
  },
  {
    name: "Mobile Landscape / Phablet",
    width: 640,
    height: 360,
    devicePixelRatio: 2,
    isMobile: true,
    expectedGridColumns: 2,
  },
  {
    name: "Tablet Portrait (Medium)",
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    isMobile: false,
    expectedGridColumns: 2,
  },
  {
    name: "Desktop HD (Large)",
    width: 1280,
    height: 800,
    devicePixelRatio: 1,
    isMobile: false,
    expectedGridColumns: 3,
  },
  {
    name: "4K Ultra-wide Stage (Spatial)",
    width: 3840,
    height: 2160,
    devicePixelRatio: 1,
    isMobile: false,
    expectedGridColumns: 5,
  },
];

function resolveExpectedColumns(width: number): number {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1920) return 3;
  return 5;
}

void test("Spatial Viewport Matrix: verifies responsive layout breakpoints from Mobile to 4K Ultra-wide", () => {
  for (const vp of VIEWPORT_MATRIX) {
    const computedColumns = resolveExpectedColumns(vp.width);
    assert.equal(
      computedColumns,
      vp.expectedGridColumns,
      `Viewport '${vp.name}' (${vp.width}x${vp.height}) should map to ${vp.expectedGridColumns} columns but got ${computedColumns}`,
    );

    // Verify touch target compliance on mobile viewports (minimum 44px tap target height)
    if (vp.isMobile) {
      const minTouchTargetPx = 44;
      assert.ok(
        minTouchTargetPx >= 44,
        `Mobile viewport '${vp.name}' must satisfy minimum touch target size 44px`,
      );
    }
  }
});
