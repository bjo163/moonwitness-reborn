import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

/**
 * Shared assertions for the `packages/ui` render tests (MW-0574).
 *
 * Two properties matter for the centralisation workstream and are easy to
 * regress silently: the design-system class must survive a caller-supplied
 * `className`, and no screen may end up shipping its own colours again. The
 * colour check runs on rendered markup, so it catches a hardcoded colour
 * wherever it lands, and comments are irrelevant to it.
 */
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const DEFAULT_PALETTE =
  /(?:bg|text|border|divide|outline|ring|placeholder)-(?:stone|zinc|neutral|gray|slate|white|black|amber|emerald|green|red|rose|sky|blue)-\d?/;

export function render(node: ReactNode): string {
  return renderToStaticMarkup(node);
}

export function assertNoOwnColours(markup: string, label: string): void {
  assert.equal(HEX.test(markup), false, `${label} rendered a hex colour`);
  assert.equal(
    DEFAULT_PALETTE.test(markup),
    false,
    `${label} rendered a Tailwind default-palette class`,
  );
}
