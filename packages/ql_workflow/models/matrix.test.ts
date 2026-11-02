import assert from "node:assert/strict";
import test from "node:test";
import { canTransition, transitionTable } from "../services/state-machine.js";
import { REVIEW_STATES, TRANSITION_ACTIONS } from "../services/workflow-vocabulary.js";

void test("Autonomous Workflow State Machine: exhaustive full transition matrix coverage", () => {
  for (const state of REVIEW_STATES) {
    for (const action of TRANSITION_ACTIONS) {
      const expected = transitionTable[state]?.[action] ?? null;
      const actual = canTransition(state, action);
      assert.equal(
        actual,
        expected,
        `Transition from state '${state}' with action '${action}' should be '${String(expected)}' but was '${String(actual)}'`,
      );
    }
  }
});
