import { expect, test } from '@playwright/test';
import type {} from './harness';

const validChart = 'sequenceDiagram\nAlice->>Bob: Hello fixture';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/render-security/index.html');
  await page.waitForFunction(() => !!window.renderHarness);
});

for (const component of ['renderer', 'diagram'] as const) {
  test(`${component}: renders a real diagram in strict mode`, async ({ page }) => {
    await page.evaluate(({ component, validChart }) => window.renderHarness.show(component, validChart), { component, validChart });
    await expect(page.locator('#root svg')).toBeVisible();
    await expect(page.locator('#root')).toContainText('Hello fixture');
    expect(await page.evaluate(() => window.renderHarness.securityLevel())).toBe('strict');
  });

  test(`${component}: error markup remains literal text and valid input recovers`, async ({ page }) => {
    await page.evaluate(component => window.renderHarness.show(component, 'fixture-error'), component);
    await expect(page.locator('#root')).toContainText('<img src="missing-fixture.png"');
    await expect(page.locator('#root img')).toHaveCount(0);
    expect(await page.evaluate(() => window.fixtureExecuted)).toBeUndefined();
    await page.evaluate(({ component, validChart }) => window.renderHarness.show(component, validChart), { component, validChart });
    await expect(page.locator('#root svg')).toBeVisible();
    await expect(page.locator('#root')).not.toContainText('Error:');
  });

  test(`${component}: real syntax error recovers on the next valid edit`, async ({ page }) => {
    await page.evaluate(component => window.renderHarness.show(component, 'sequenceDiagram\nAlice->>'), component);
    await expect(page.locator('#root')).toContainText(/Error|Failed to render/);
    await expect(page.locator('#root svg')).toHaveCount(0);
    await page.evaluate(({ component, validChart }) => window.renderHarness.show(component, validChart), { component, validChart });
    await expect(page.locator('#root svg')).toBeVisible();
    await expect(page.locator('#root')).toContainText('Hello fixture');
  });

  for (const reject of [false, true]) {
    test(`${component}: late ${reject ? 'error' : 'success'} cannot overwrite newer diagram`, async ({ page }) => {
      await page.evaluate(component => window.renderHarness.show(component, 'fixture-delay-old'), component);
      await page.waitForFunction(() => window.renderHarness.pending('fixture-delay-old'));
      await page.evaluate(component => window.renderHarness.show(component, 'fixture-delay-new'), component);
      await page.waitForFunction(() => window.renderHarness.pending('fixture-delay-new'));
      await page.evaluate(() => window.renderHarness.settle('fixture-delay-new'));
      await expect(page.locator('#root')).toContainText('fixture-delay-new');
      await page.evaluate(async reject => {
        window.renderHarness.settle('fixture-delay-old', reject);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, reject);
      await expect(page.locator('#root')).toContainText('fixture-delay-new');
      await expect(page.locator('#root')).not.toContainText('stale fixture error');
      await expect(page.locator('#root')).not.toContainText('fixture-delay-old');
    });
  }
}

test('renderer: clearing input clears the previous diagram and pending render', async ({ page }) => {
  await page.evaluate(() => window.renderHarness.show('renderer', 'fixture-delay-old'));
  await page.waitForFunction(() => window.renderHarness.pending('fixture-delay-old'));
  await page.evaluate(() => window.renderHarness.show('renderer', ''));
  await page.evaluate(async () => {
    window.renderHarness.settle('fixture-delay-old');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await expect(page.locator('#root')).toHaveText('');
  await expect(page.locator('#root svg')).toHaveCount(0);
});
