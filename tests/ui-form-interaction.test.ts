import { defineTest } from "@qatool/core";

export default defineTest({
  id: "tc-ui-002",
  name: "UI — Form Interactions, Typing & Input Validation",
  type: "ui",
  tags: ["ui", "regression"],
  steps: [
    {
      id: "s1",
      name: "Load demo form page and verify input fields",
      action: "browser.step",
      payload: {
        actions: [
          { action: "goto", url: "https://the-internet.herokuapp.com/login" },
          { action: "assertElementExists", selector: "#username" },
          { action: "assertElementExists", selector: "#password" },
          { action: "assertIsVisible", selector: "button[type='submit']" },
        ],
      },
    },
    {
      id: "s2",
      name: "Fill credentials and submit login form",
      action: "browser.step",
      payload: {
        actions: [
          { action: "type", selector: "#username", text: "tomsmith" },
          { action: "type", selector: "#password", text: "SuperSecretPassword!" },
          { action: "click", selector: "button[type='submit']" },
          { action: "waitForUrl", urlFragment: "/secure" },
          { action: "assertElementExists", selector: ".flash.success" },
          { action: "assertTextContains", selector: ".flash.success", expected: "You logged into a secure area!" },
        ],
      },
    },
  ],
  assertions: [],
});
