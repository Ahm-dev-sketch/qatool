import { defineTest } from "../src/core/define.js";

export default defineTest({
  id: "tc-smoke-001",
  name: "Smoke — all assertions pass",
  type: "api",
  tags: ["smoke"],
  steps: [
    {
      id: "s1",
      name: "1 + 1 equals 2",
      action: "assert",
      payload: null,
    },
    {
      id: "s2",
      name: "String contains substring",
      action: "assert",
      payload: null,
    },
    {
      id: "s3",
      name: "Value is truthy",
      action: "assert",
      payload: null,
    },
  ],
  assertions: [
    {
      id: "a1",
      stepId: "s1",
      type: "toEqual",
      expected: 2,
      actual: 1 + 1,
    },
    {
      id: "a2",
      stepId: "s2",
      type: "toContain",
      expected: "world",
      actual: "hello world",
    },
    {
      id: "a3",
      stepId: "s3",
      type: "toBeTruthy",
      actual: "non-empty string",
    },
  ],
});