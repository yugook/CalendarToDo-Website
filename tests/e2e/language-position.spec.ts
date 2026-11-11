import type { Page } from '@playwright/test';
import { LOCALE_PATHS, SUPPORT_PATHS } from '../../src/config/site';
import { test, expect } from './fixtures';
import { navigateAndWait } from './helpers';

const progress = 0.4;
const cases = [
  { paths: LOCALE_PATHS, section: 'features' },
  { paths: SUPPORT_PATHS, section: 'external-calendars' },
];

async function readingPosition(page: Page, sectionId: string) {
  return page.locator(`#${sectionId}`).evaluate((section) => {
    const rect = section.getBoundingClientRect();
    const headerBottom = document.querySelector('header')!.getBoundingClientRect().bottom;
    const visibleHeight = document.documentElement.clientHeight - headerBottom;
    const range = rect.height - visibleHeight;
    return { top: rect.top, headerBottom, range, progress: (headerBottom - rect.top) / range };
  });
}

async function scrollIntoSection(page: Page, sectionId: string, fraction = progress) {
  await page.evaluate(() => document.fonts.ready);
  const position = await readingPosition(page, sectionId);
  expect(position.range, 'Both languages must exercise scrolling within the section').toBeGreaterThan(100);
  await page.evaluate((offset) => window.scrollBy(0, offset),
    position.top - position.headerBottom + position.range * fraction);
}

async function expectReadingProgress(page: Page, sectionId: string) {
  expect((await readingPosition(page, sectionId)).range).toBeGreaterThan(100);
  await expect.poll(async () => Math.abs((await readingPosition(page, sectionId)).progress - progress), {
    message: `Preserve reading progress within #${sectionId} below the sticky header`,
  }).toBeLessThan(0.01);
}

async function expectSectionStart(page: Page, sectionId: string) {
  await expect.poll(async () => {
    const position = await readingPosition(page, sectionId);
    return Math.abs(position.top - position.headerBottom);
  }, { message: `The start of #${sectionId} must remain below the sticky header` }).toBeLessThanOrEqual(3);
  await expect(page.locator(`#${sectionId}`).getByRole('heading', { level: 2 })).toBeInViewport();
}

async function switchLanguage(page: Page, language: string, path: string, sectionId: string, isMobile: boolean) {
  const link = page.getByRole('navigation', { name: /^(表示言語|Display language)$/ })
    .getByRole('link', { name: language, exact: true });
  await expect(link).toBeInViewport();
  const bounds = await link.boundingBox();
  if (!bounds) throw new Error('Language link has no bounding box');
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  // Avoid Locator.click() scrolling WebKit's already-visible sticky header.
  await expect.poll(() => link.evaluate((element, point) =>
    element.contains(document.elementFromPoint(point.x, point.y)), { x, y }),
  ).toBe(true);
  await navigateAndWait(page, { pathname: path, hash: `#${sectionId}` }, () =>
    isMobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
}

for (const entry of cases) {
  test(`${entry.paths.ja} preserves the reading position through a language round trip`, async ({ page, isMobile }) => {
    // A short viewport ensures the support section overflows in both languages.
    if (entry.paths === SUPPORT_PATHS) await page.setViewportSize({ width: page.viewportSize()!.width, height: 400 });
    await page.goto(entry.paths.ja);
    await scrollIntoSection(page, entry.section);
    await expectReadingProgress(page, entry.section);

    for (const locale of ['en', 'ja'] as const) {
      await switchLanguage(page, locale === 'en' ? 'English' : '日本語', entry.paths[locale], entry.section, isMobile);
      await expectReadingProgress(page, entry.section);
    }
  });

  test(`${entry.paths.ja} keeps the section heading below the sticky header`, async ({ page, isMobile }) => {
    if (entry.paths === SUPPORT_PATHS) await page.setViewportSize({ width: page.viewportSize()!.width, height: 400 });
    await page.goto(entry.paths.ja);
    await scrollIntoSection(page, entry.section, 0);
    await switchLanguage(page, 'English', entry.paths.en, entry.section, isMobile);
    await expectSectionStart(page, entry.section);
  });
}

test('language switching keeps the section when sessionStorage is unavailable', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() { throw new DOMException('Storage is unavailable', 'SecurityError'); },
    });
  });
  await page.goto(LOCALE_PATHS.ja);
  await scrollIntoSection(page, 'features');
  await switchLanguage(page, 'English', LOCALE_PATHS.en, 'features', isMobile);
  await expectSectionStart(page, 'features');
});

test('adds the URL fragment only after restoring without a native fragment jump', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.dataset.initialFragment = location.hash || 'none';
    }, { once: true });
  });
  await page.goto(LOCALE_PATHS.ja);
  await scrollIntoSection(page, 'features');
  await switchLanguage(page, 'English', LOCALE_PATHS.en, 'features', isMobile);
  await expect(page.locator('html')).toHaveAttribute('data-initial-fragment', 'none');
  await expectReadingProgress(page, 'features');
});

test('respects scrolling without DOM input events after restoration', async ({ page, isMobile }) => {
  await page.goto(LOCALE_PATHS.ja);
  await scrollIntoSection(page, 'features');
  await switchLanguage(page, 'English', LOCALE_PATHS.en, 'features', isMobile);
  await expectReadingProgress(page, 'features');
  const previousY = await page.evaluate(() => window.scrollY);
  // Native scrollbar drags need not emit pointerdown/wheel/keydown in the page.
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(previousY + 200, 0);
});

test('does not pull the reader back after keyboard scrolling', async ({ page, isMobile }) => {
  await page.goto(LOCALE_PATHS.ja);
  await scrollIntoSection(page, 'features');
  await switchLanguage(page, 'English', LOCALE_PATHS.en, 'features', isMobile);
  await expectReadingProgress(page, 'features');
  await page.keyboard.press('PageDown');
  await expect.poll(async () => (await readingPosition(page, 'features')).progress).toBeGreaterThan(0.45);
  await page.evaluate(() => window.dispatchEvent(new Event('scrollend')));
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await readingPosition(page, 'features')).progress).toBeGreaterThan(0.45);
});

for (const input of ['keyboard', 'native scroll'] as const) {
  test(`respects ${input} input before the page finishes loading`, async ({ page }) => {
    let release!: () => void;
    const pendingImage = new Promise<void>((resolve) => { release = resolve; });
    await page.route('**/__e2e_slow_image__.svg', async (route) => {
      await pendingImage;
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' });
    });
    await page.addInitScript(() => {
      sessionStorage.setItem('calendar-todo:language-position', JSON.stringify({
        path: '/en/', sectionId: 'features', progress: 0.4,
      }));
      document.addEventListener('DOMContentLoaded', () => {
        const image = new Image(1, 1);
        image.src = '/__e2e_slow_image__.svg';
        document.body.append(image);
      }, { once: true });
    });
    try {
      await page.goto(LOCALE_PATHS.en, { waitUntil: 'domcontentloaded' });
      expect(await page.evaluate(() => document.readyState)).not.toBe('complete');
      if (input === 'keyboard') await page.keyboard.press('Home');
      else await page.evaluate(() => window.scrollTo(0, 250));
      release();
      await page.waitForLoadState('load');
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(input === 'keyboard' ? 0 : 250, 0);
    } finally {
      release();
    }
  });
}
