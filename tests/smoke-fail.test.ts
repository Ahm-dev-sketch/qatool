import { defineTest } from "@qatool/core";

export default defineTest({
  id: "tc-smoke-002",
  name: "Smoke — deliberate failure",
  type: "api",
  tags: ["smoke"],
  steps: [
    {
      id: "s1",
      name: "Passing step",
      action: "assert",
      payload: null,
    },
    {
      id: "s2",
      name: "Failing step — wrong equality",
      action: "assert",
      payload: null,
    },
  ],
  assertions: [
    {
      id: "a1",
      stepId: "s1",
      type: "toEqual",
      expected: 10,
      actual: 10,
    },
    {
      id: "a2",
      stepId: "s2",
      type: "toEqual",
      expected: 42,
      actual: 99,   // intentionally wrong
    },
  ],
});