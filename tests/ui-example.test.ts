import { defineTest } from "../src/core/define.js";

export default defineTest({
  id: "tc-ui-001",
  name: "UI — example.com navigation and content checks",
  type: "ui",
  tags: ["ui", "smoke"],
  steps: [
    {
      id: "s1",
      name: "Navigate to example.com and verify page loads",
      action: "browser.step",
      payload: {
        actions: [
          { action: "navigate", url: "https://example.com" },
          { action: "assertElementExists", selector: "h1" },
          { action: "assertIsVisible", selector: "h1" },
          { action: "assertTextContains", selector: "h1", expected: "Example Domain" },
        ],
      },
    },
    {
      id: "s2",
      name: "Verify page content and link presence",
      action: "browser.step",
      payload: {
        actions: [
          { action: "assertElementExists", selector: "p" },
          { action: "assertElementExists", selector: "a" },
          { action: "assertTextContains", selector: "p", expected: "documentation" },
          { action: "assertUrlContains", expected: "example.com" },
        ],
      },
    },
    {
      id: "s3",
      name: "Verify page title",
      action: "browser.step",
      payload: {
        actions: [
          { action: "assertTitleEquals", expected: "Example Domain" },
        ],
      },
    },
  ],
  assertions: [], // all assertions are inline in step payloads
});