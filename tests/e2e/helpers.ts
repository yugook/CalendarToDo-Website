import type { Page } from '@playwright/test';
import { expect } from './fixtures';

export async function navigateAndWait(
  page: Page,
  target: { pathname: string; hash?: string },
  action: () => Promise<unknown>,
) {
  await Promise.all([
    page.waitForURL((url) => url.pathname === target.pathname &&
      (target.hash === undefined || url.hash === target.hash), { waitUntil: 'load' }),
    action(),
  ]);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewport: document.documentElement.clientWidth,
  }));
  const viewport = Math.min(width.viewport, page.viewportSize()?.width ?? width.viewport);
  expect(width.content, 'Content should fit the layout viewport').toBeLessThanOrEqual(viewport + 1);
}
