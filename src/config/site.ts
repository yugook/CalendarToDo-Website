import type { Locale } from '../i18n/types';

export const SITE_NAME = 'Calendar ToDo';
export const SITE_URL = 'https://calendartodo.app/';

export const LOCALE_PATHS = {
  ja: '/',
  en: '/en/',
} as const satisfies Record<Locale, string>;

export const OG_IMAGE_PATHS = {
  ja: '/og/ja.png',
  en: '/og/en.png',
} as const satisfies Record<Locale, string>;

// TODO: App Storeでの公開後、Calendar ToDoのアプリ固有URLへ差し替える。
export const APP_STORE_URLS = {
  ja: 'https://apps.apple.com/jp/search?term=Calendar%20ToDo',
  en: 'https://apps.apple.com/us/search?term=Calendar%20ToDo',
} as const satisfies Record<Locale, string>;
