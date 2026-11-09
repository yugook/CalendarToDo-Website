import { test, expect } from './fixtures';

const pages = [
  { paths: ['/', '/en/'], headings: ['予定を入れるだけで、終わらせない。', "Don't let your plans end on the calendar."] },
  { paths: ['/support/', '/en/support/'], headings: ['Calendar ToDo サポート', 'Calendar ToDo Support'] },
  { paths: ['/terms/', '/en/terms/'], headings: ['利用規約', 'Terms of Service'] },
  { paths: ['/privacy/', '/en/privacy/'], headings: ['プライバシーポリシー', 'Privacy Policy'] },
] as const;

for (const entry of pages) {
  for (const [index, locale] of ['ja', 'en'].entries()) {
    const alternate = 1 - index;

    test(`${entry.paths[index]} renders and switches to its translated page`, async ({ page }) => {
      const response = await page.goto(entry.paths[index]);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.headings[index]);

      const width = await page.evaluate(() => ({
        content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        viewport: window.innerWidth,
      }));
      expect(width.content, 'Page should not overflow horizontally').toBeLessThanOrEqual(width.viewport + 1);

      const switcher = page.getByRole('navigation', {
        name: index === 0 ? '表示言語' : 'Display language', exact: true,
      });
      const link = switcher.getByRole('link', { name: index === 0 ? 'English' : '日本語', exact: true });
      await expect(link).toBeInViewport();
      await link.click();

      await expect(page).toHaveURL((url) => url.pathname === entry.paths[alternate]);
      await page.waitForLoadState('load');
      await expect(page.locator('html')).toHaveAttribute('lang', index === 0 ? 'en' : 'ja');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.headings[alternate]);
    });
  }
}

for (const locale of ['ja', 'en'] as const) {
  const isJapanese = locale === 'ja';
  const home = isJapanese ? '/' : '/en/';
  const prefix = isJapanese ? '' : '/en';

  test(`${locale}: keyboard skip link and footer links reach the main pages`, async ({ page, browserName }) => {
    await page.goto(home);
    // macOS WebKit uses Option+Tab to include links in keyboard navigation.
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
    const skipLink = page.getByRole('link', { name: isJapanese ? '本文へ移動' : 'Skip to content', exact: true });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL((url) => url.hash === '#main-content');

    for (const [path, label] of [
      ['/support/', isJapanese ? 'サポート' : 'Support'],
      ['/terms/', isJapanese ? '利用規約' : 'Terms of Service'],
      ['/privacy/', isJapanese ? 'プライバシーポリシー' : 'Privacy Policy'],
    ]) {
      await page.getByRole('navigation', {
        name: isJapanese ? 'フッターナビゲーション' : 'Footer navigation', exact: true,
      }).getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL((url) => url.pathname === `${prefix}${path}`);
      await page.waitForLoadState('load');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test(`${locale}: product images load when scrolled into view`, async ({ page }) => {
    await page.goto(home);
    const images = page.getByRole('main').getByRole('img');
    expect(await images.count()).toBeGreaterThan(0);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element) => {
        const imageElement = element as HTMLImageElement;
        return imageElement.complete && imageElement.naturalWidth > 0;
      }), { message: 'Product image should finish loading' }).toBe(true);
    }
  });

  test(`${locale}: narrow support page FAQ works with pointer and keyboard`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`${prefix}/support/`);
    const faq = page.locator('#faq details').first();
    const summary = faq.locator('summary');
    const answer = faq.locator('p').first();
    await expect(answer).toBeHidden();
    await summary.click();
    await expect(faq).toHaveAttribute('open', '');
    await expect(answer).toBeVisible();
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(answer).toBeHidden();
    await page.keyboard.press('Space');
    await expect(answer).toBeVisible();
    const width = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth));
    expect(width, 'Expanded FAQ should fit a 320px viewport').toBeLessThanOrEqual(321);
  });
}
