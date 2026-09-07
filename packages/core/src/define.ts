import type { TestCase } from "./types.js";

/**
 * defineTest — typed DSL builder.
 * Returns the TestCase unchanged; the function exists for type inference
 * and a clear, named entry point in test files.
 */
export function defineTest(testCase: TestCase): TestCase {
  return testCase;
}
