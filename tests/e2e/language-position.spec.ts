import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const progress = 0.4;

async function scrollIntoSection(page: Page, sectionId: string) {
  await page.evaluate(() => document.fonts.ready);
  const scrollable = await page.locator(`#${sectionId}`).evaluate((section, fraction) => {
    const height = Math.max((section as HTMLElement).offsetHeight - window.innerHeight, 0);
    window.scrollTo(0, (section as HTMLElement).offsetTop + height * fraction);
    return height;
  }, progress);
  return scrollable;
}

async function expectRestoredPosition(page: Page, sectionId: string, fraction: number) {
  await expect.poll(() => page.locator(`#${sectionId}`).evaluate((section, expectedProgress) => {
    const element = section as HTMLElement;
    const height = Math.max(element.offsetHeight - window.innerHeight, 0);
    return Math.abs(window.scrollY - (element.offsetTop + height * expectedProgress));
  }, fraction), { message: `Restore reading position within #${sectionId}` }).toBeLessThanOrEqual(3);
}

async function switchLanguage(page: Page, language: string, path: string, sectionId: string, isMobile: boolean) {
  const link = page.getByRole('navigation', { name: /^(表示言語|Display language)$/ })
    .getByRole('link', { name: language, exact: true });
  await expect(link).toBeInViewport();
  const bounds = await link.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) throw new Error('Language link has no bounding box');
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  // A user clicks the visible sticky header. Locator.click() can itself scroll
  // that header in WebKit, changing the reading position before the click.
  await expect.poll(() => link.evaluate((element, point) =>
    element.contains(document.elementFromPoint(point.x, point.y)), { x, y }),
  ).toBe(true);
  await Promise.all([
    page.waitForURL((url) => url.pathname === path && url.hash === `#${sectionId}`, { waitUntil: 'load' }),
    isMobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y),
  ]);
}

for (const entry of [
  { paths: ['/', '/en/'], section: 'features' },
  { paths: ['/support/', '/en/support/'], section: 'external-calendars' },
]) {
  test(`${entry.paths[0]} preserves the reading position through a language round trip`, async ({ page, isMobile }) => {
    await page.goto(entry.paths[0]);
    const height = await scrollIntoSection(page, entry.section);
    // The home page must exercise progress restoration, beyond a plain hash jump.
    if (entry.section === 'features') expect(height).toBeGreaterThan(100);
    await expectRestoredPosition(page, entry.section, progress);

    for (const [index, language] of ['English', '日本語'].entries()) {
      await switchLanguage(page, language, entry.paths[index === 0 ? 1 : 0], entry.section, isMobile);
      await expectRestoredPosition(page, entry.section, progress);
    }
  });
}

test('language switching keeps the section when sessionStorage is unavailable', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() { throw new DOMException('Storage is unavailable', 'SecurityError'); },
    });
  });
  await page.goto('/');
  await scrollIntoSection(page, 'features');
  await expectRestoredPosition(page, 'features', progress);
  await switchLanguage(page, 'English', '/en/', 'features', isMobile);
  await expectRestoredPosition(page, 'features', 0);
});
