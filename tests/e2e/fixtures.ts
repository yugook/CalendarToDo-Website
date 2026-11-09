import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ pageErrors: void }>({
  pageErrors: [async ({ page, browserName }, use, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      // Chromium can cancel CSS-only cross-document transitions. This native,
      // stackless exception is reported separately; application errors still fail.
      if (browserName === 'chromium' && error.name === 'InvalidStateError' &&
          error.message === 'Transition was aborted because of invalid state. ViewTransition opt-in disabled' &&
          !error.stack) {
        testInfo.annotations.push({ type: 'native-view-transition', description: error.message });
        return;
      }
      errors.push(`${error.name}: ${error.message}`);
    });
    await use();
    expect(errors, 'Unhandled browser JavaScript errors').toEqual([]);
  }, { auto: true }],
});

export { expect };
