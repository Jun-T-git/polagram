import { expect, test } from '@playwright/test';

test('playground renders diagram', async ({ page }) => {
  await page.goto('/playground');

  // Input code
  const code = `
sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!
`;
  
  // Switch to diagram tab (default is polagram.yml)
  await page.getByRole('button', { name: 'diagram.mmd' }).click();

  // Assuming there is a textarea  // This is a robust selector
  const editor = page.getByPlaceholder('Enter sequence diagram code (Mermaid)...');
  await expect(editor).toBeVisible();
  
  await editor.fill(code);

  // Wait for rendering
  // The diagram is rendered inside a SequenceDiagram component using MermaidRenderer
  // The output usually contains an SVG.
  // We can check for the presence of the SVG or some text inside the diagram.
  
  // Wait a bit for debounce and rendering
  await page.waitForTimeout(2000); 

  // Check if text inside diagram is visible
  // The diagram might be in an iframe or shadow DOM, or just SVG.
  // Check for the container first (target the mermaid svg specifically)
  await expect(page.locator('svg[id^="mermaid-"]').first()).toBeVisible();
  await expect(page.getByText('Hello Bob, how are you?').first()).toBeVisible();
});
