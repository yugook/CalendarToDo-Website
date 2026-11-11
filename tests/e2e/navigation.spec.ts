import { test, expect } from './fixtures';
import { LEGAL_PATHS, LOCALE_PATHS, SUPPORT_PATHS } from '../../src/config/site';
import { expectNoHorizontalOverflow, navigateAndWait } from './helpers';
import { pages } from './site-cases';

for (const entry of pages) {
  for (const locale of ['ja', 'en'] as const) {
    const alternate = locale === 'ja' ? 'en' : 'ja';

    test(`${entry.paths[locale]} renders and switches to its translated page`, async ({ page }) => {
      const response = await page.goto(entry.paths[locale]);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.headings[locale]);
      await expectNoHorizontalOverflow(page);

      const switcher = page.getByRole('navigation', {
        name: locale === 'ja' ? '表示言語' : 'Display language', exact: true,
      });
      const link = switcher.getByRole('link', { name: locale === 'ja' ? 'English' : '日本語', exact: true });
      await expect(link).toBeInViewport();
      await navigateAndWait(page, { pathname: entry.paths[alternate] }, () => link.click());
      await expect(page.locator('html')).toHaveAttribute('lang', alternate);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.headings[alternate]);
    });
  }
}

for (const locale of ['ja', 'en'] as const) {
  const isJapanese = locale === 'ja';
  const home = LOCALE_PATHS[locale];

  test(`${locale}: keyboard skip link and footer links reach the main pages`, async ({ page, browserName }) => {
    await page.goto(home);
    // macOS WebKit uses Option+Tab to include links in keyboard navigation.
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
    const skipLink = page.getByRole('link', { name: isJapanese ? '本文へ移動' : 'Skip to content', exact: true });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    await navigateAndWait(page, { pathname: home, hash: '#main-content' }, () => page.keyboard.press('Enter'));

    for (const [path, label] of [
      [SUPPORT_PATHS[locale], isJapanese ? 'サポート' : 'Support'],
      [LEGAL_PATHS.terms[locale], isJapanese ? '利用規約' : 'Terms of Service'],
      [LEGAL_PATHS.privacy[locale], isJapanese ? 'プライバシーポリシー' : 'Privacy Policy'],
    ]) {
      const link = page.getByRole('navigation', {
        name: isJapanese ? 'フッターナビゲーション' : 'Footer navigation', exact: true,
      }).getByRole('link', { name: label, exact: true });
      await navigateAndWait(page, { pathname: path }, () => link.click());
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
    await page.goto(SUPPORT_PATHS[locale]);
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
    await expectNoHorizontalOverflow(page);
  });
}
