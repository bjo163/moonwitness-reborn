import assert from "node:assert/strict";
import test from "node:test";
import type * as Types from "./index.js";
import type * as StrictSignatures from "./strict-signatures.js";

void test("the entrypoint re-exports the field vocabulary ql_orm declares", () => {
  const field: Types.FieldType = "char";
  const view: Types.ViewType = "form";
  assert.equal(field, "char");
  assert.equal(view, "form");
});

void test("the entrypoint re-exports the strict-signature helpers", () => {
  const callback: StrictSignatures.CallbackWithVoidThis<[], string> = () => "ok";
  assert.equal(callback(), "ok");
});
