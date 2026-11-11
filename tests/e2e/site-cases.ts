import { LEGAL_PATHS, LOCALE_PATHS, SUPPORT_PATHS } from '../../src/config/site';
import { homeContent } from '../../src/i18n';
import { supportContent } from '../../src/i18n/support';
import { LEGAL_PAGES } from '../../scripts/lib/legal-contract.mjs';

function legalTitle(section: string, locale: string) {
  const page = LEGAL_PAGES.find((entry) => entry.section === section && entry.locale === locale);
  if (!page) throw new Error(`Missing legal contract for ${section}/${locale}`);
  return page.title;
}

export const pages = [
  { paths: LOCALE_PATHS, headings: { ja: homeContent.ja.hero.title, en: homeContent.en.hero.title } },
  { paths: SUPPORT_PATHS, headings: { ja: supportContent.ja.title, en: supportContent.en.title } },
  ...(['terms', 'privacy'] as const).map((section) => ({
    paths: LEGAL_PATHS[section],
    headings: { ja: legalTitle(section, 'ja'), en: legalTitle(section, 'en') },
  })),
];
