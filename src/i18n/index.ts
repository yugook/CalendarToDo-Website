import { enHome } from './home/en';
import { jaHome } from './home/ja';
import type { HomeContent, Locale } from './types';

export const homeContent = {
  ja: jaHome,
  en: enHome,
} satisfies Record<Locale, HomeContent>;

export type { HomeContent, Locale } from './types';
