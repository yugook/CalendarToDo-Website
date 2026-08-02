import type { Locale } from '../i18n/types';

export const SITE_NAME = 'Calendar ToDo';
export const SITE_URL = 'https://calendartodo.app/';

export const LOCALE_PATHS = {
  ja: '/',
  en: '/en/',
} as const satisfies Record<Locale, string>;

export const OG_IMAGE_PATHS = {
  ja: '/og/ja.png?v=4',
  en: '/og/en.png?v=4',
} as const satisfies Record<Locale, string>;

export const APP_STORE_URLS = {
  ja: 'https://apps.apple.com/jp/app/calendar-todo/id6756511434',
  en: 'https://apps.apple.com/us/app/calendar-todo/id6756511434',
} as const satisfies Record<Locale, string>;
