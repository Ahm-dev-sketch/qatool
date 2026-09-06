import CDP from "chrome-remote-interface";

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Get element center coordinates using DOM.getBoxModel via nodeId.
 * nodeId comes from DOM.querySelector.
 */
async function getElementCenter(
  client: CDP.Client,
  selector: string,
): Promise<{ x: number; y: number }> {
  const { DOM } = client;

  // Get root document nodeId
  const { root } = await DOM.getDocument({ depth: 0 });

  // Find element nodeId by CSS selector
  const { nodeId } = await DOM.querySelector({
    nodeId: root.nodeId,
    selector,
  });

  if (!nodeId) {
    throw new Error(`Element not found: "${selector}"`);
  }

  // Get bounding box
  const { model } = await DOM.getBoxModel({ nodeId });

  // content is [x1,y1, x2,y1, x2,y2, x1,y2] (quad)
  const [x1, y1, x2, , , y2] = model.content;
  return {
    x: Math.round((x1 + x2) / 2),
    y: Math.round((y1 + y2) / 2),
  };
}

// ── Public element interaction API ──────────────────────────────────────────────

/**
 * Click an element identified by CSS selector.
 * Dispatches mousePressed + mouseReleased via Input domain.
 */
export async function click(
  client: CDP.Client,
  selector: string,
): Promise<void> {
  const { Input } = client;
  const { x, y } = await getElementCenter(client, selector);

  await Input.dispatchMouseEvent({
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await Input.dispatchMouseEvent({
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
}

/**
 * Type text into an element (click to focus first, then dispatch key events).
 * Uses Input.dispatchKeyEvent with type "char" for each character.
 */
export async function type(
  client: CDP.Client,
  selector: string,
  text: string,
): Promise<void> {
  // Focus the element first
  await click(client, selector);

  const { Input } = client;

  for (const char of text) {
    await Input.dispatchKeyEvent({ type: "keyDown", text: char });
    await Input.dispatchKeyEvent({ type: "keyUp", text: char });
  }
}

/**
 * Get the visible text content of an element.
 * Uses Runtime.evaluate with document.querySelector().innerText.
 */
export async function getText(
  client: CDP.Client,
  selector: string,
): Promise<string> {
  const { Runtime } = client;

  const result = await Runtime.evaluate({
    expression: `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        return el ? el.innerText : null;
      })()
    `,
    returnByValue: true,
  });

  if (result.result.value === null || result.result.value === undefined) {
    throw new Error(`Element not found or has no text: "${selector}"`);
  }

  return String(result.result.value);
}

/**
 * Get the value of an HTML attribute on an element.
 * Uses Runtime.evaluate with getAttribute.
 */
export async function getAttribute(
  client: CDP.Client,
  selector: string,
  attribute: string,
): Promise<string | null> {
  const { Runtime } = client;

  const result = await Runtime.evaluate({
    expression: `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        return el ? el.getAttribute(${JSON.stringify(attribute)}) : null;
      })()
    `,
    returnByValue: true,
  });

  return result.result.value as string | null;
}

/**
 * Clear the value of an input element, then type new text.
 */
export async function clearAndType(
  client: CDP.Client,
  selector: string,
  text: string,
): Promise<void> {
  const { Runtime } = client;

  // Select all and delete existing content
  await click(client, selector);
  await Runtime.evaluate({
    expression: `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (el) { el.value = ''; el.dispatchEvent(new Event('input', {bubbles:true})); }
      })()
    `,
  });

  await type(client, selector, text);
}