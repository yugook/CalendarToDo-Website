import type { Locale } from '../i18n/types';

export const SITE_NAME = 'Calendar ToDo';
export const SITE_URL = 'https://calendartodo.app/';

export const LOCALE_PATHS = {
  ja: '/',
  en: '/en/',
} as const satisfies Record<Locale, string>;

export const LEGAL_PATHS = {
  terms: {
    ja: '/terms/',
    en: '/en/terms/',
  },
  privacy: {
    ja: '/privacy/',
    en: '/en/privacy/',
  },
  policy: '/legal/policy.json',
} as const satisfies {
  terms: Record<Locale, string>;
  privacy: Record<Locale, string>;
  policy: string;
};

export const SUPPORT_PATHS = {
  ja: '/support/',
  en: '/en/support/',
} as const satisfies Record<Locale, string>;

export const SUPPORT_EMAIL = 'yugo.work.contact@gmail.com';
export const SUPPORT_UPDATED_AT = '2026-06-11';

export const OG_IMAGE_PATHS = {
  ja: '/og/ja.png?v=4',
  en: '/og/en.png?v=4',
} as const satisfies Record<Locale, string>;

export const APP_STORE_URLS = {
  ja: 'https://apps.apple.com/jp/app/calendar-todo/id6756511434',
  en: 'https://apps.apple.com/us/app/calendar-todo/id6756511434',
} as const satisfies Record<Locale, string>;

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/calendartodo.app/?hl=ja',
  youtube: 'https://www.youtube.com/@Yugook_Dev_Log',
  github: 'https://github.com/yugook',
} as const;
