import { defineTest } from "@qatool/core";

export default defineTest({
  id: "tc-ui-001",
  name: "UI — Playwright Core Navigation & Element Verification",
  type: "ui",
  tags: ["ui", "smoke"],
  steps: [
    {
      id: "s1",
      name: "Navigate to example.com and verify DOM elements",
      action: "browser.step",
      payload: {
        actions: [
          { action: "goto", url: "https://example.com" },
          { action: "assertElementExists", selector: "h1" },
          { action: "assertIsVisible", selector: "h1" },
          { action: "assertTextContains", selector: "h1", expected: "Example Domain" },
        ],
      },
    },
    {
      id: "s2",
      name: "Verify page body content and URL structure",
      action: "browser.step",
      payload: {
        actions: [
          { action: "assertElementExists", selector: "p" },
          { action: "assertElementExists", selector: "a" },
          { action: "assertTextContains", selector: "p", expected: "documentation" },
          { action: "assertUrlContains", expected: "example.com" },
          { action: "assertTitleEquals", expected: "Example Domain" },
        ],
      },
    },
  ],
  assertions: [],
});
