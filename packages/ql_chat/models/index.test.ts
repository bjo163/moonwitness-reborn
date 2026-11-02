import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../__manifest__.js";
import { chatCitation } from "./chat_citation.js";
import { chatMessage } from "./chat_message.js";

void test("chat grounding and citation records are private, deny-by-default models", () => {
  assert.equal(manifest.models.length, 3);
  assert.equal(chatMessage.fields.grounding_status.private, true);
  assert.deepEqual(chatMessage.fields.grounding_status.options, [
    "grounded",
    "insufficient_evidence",
    "legacy",
  ]);
  assert.equal(chatCitation.name, "chat.citation");
  assert.equal(chatCitation.ownerField, "owner_id");
  assert.equal("text" in chatCitation.fields, false);
  for (const field of Object.values(chatCitation.fields)) {
    assert.equal(field.private, true);
  }
  const citationAccess = manifest.access?.find(
    (entry) => entry.model === "chat.citation",
  );
  assert.ok(citationAccess);
  assert.equal(citationAccess.read, false);
  assert.equal(citationAccess.write, false);
  assert.equal(citationAccess.create, false);
  assert.equal(citationAccess.unlink, false);
});
