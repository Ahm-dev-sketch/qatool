import { defineTest } from "@qatool/core";

export default defineTest({
  id: "tc-regression-001",
  name: "Regression — numeric and array assertions",
  type: "api",
  tags: ["regression"],
  steps: [
    {
      id: "s1",
      name: "Response time under threshold",
      action: "assert",
      payload: null,
    },
    {
      id: "s2",
      name: "Array contains expected item",
      action: "assert",
      payload: null,
    },
    {
      id: "s3",
      name: "HTTP status check",
      action: "assert",
      payload: null,
    },
  ],
  assertions: [
    {
      id: "a1",
      stepId: "s1",
      type: "toBeGreaterThan",
      expected: 0,
      actual: 150,
    },
    {
      id: "a2",
      stepId: "s2",
      type: "toContain",
      expected: "banana",
      actual: ["apple", "banana", "cherry"],
    },
    {
      id: "a3",
      stepId: "s3",
      type: "toBeStatus",
      expected: 200,
      actual: 200,
    },
  ],
});