import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ pageErrors: void }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(`${error.name}: ${error.message}`);
    });
    await use();
    expect(errors, 'Unhandled browser JavaScript errors').toEqual([]);
  }, { auto: true }],
});

export { expect };
