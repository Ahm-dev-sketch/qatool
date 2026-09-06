import { defineTest } from "../src/core/define.js";

// Stateful counter to simulate flaky network or transient failure
let callCount = 0;

export default defineTest({
  id: "tc-flaky-001",
  name: "Orchestration — Flaky test detection",
  type: "api",
  tags: ["flaky", "orchestration"],
  steps: [
    {
      id: "s1",
      name: "Step that passes only on retry",
      action: "assert",
      payload: null,
    },
  ],
  assertions: [
    {
      id: "a1",
      stepId: "s1",
      type: "toEqual",
      expected: true,
      get actual() {
        callCount++;
        // First run fails (callCount = 1), retry run passes (callCount = 2)
        return callCount > 1;
      },
    },
  ],
});
