export const locales = ['ja', 'en'] as const;

export type Locale = (typeof locales)[number];
export type ScreenshotKey = 'today' | 'dashboard' | 'weekly';

export interface FeatureContent {
  screenshot: ScreenshotKey;
  title: string;
  description: string;
  imageAlt: string;
  imageCaption: string;
}

export interface HomeContent {
  seo: {
    title: string;
    description: string;
    imageAlt: string;
  };
  accessibility: {
    skipLink: string;
  };
  navigation: {
    label: string;
    footerLabel: string;
    homeLabel: string;
    languageLabel: string;
    features: string;
    privacy: string;
    developer: string;
  };
  store: {
    compactLabel: string;
    buttonLabel: string;
    ariaLabel: string;
    note: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    description: string;
    supportedCalendarsLabel: string;
    supportedCalendars: readonly string[];
    imageAlt: string;
    imageCaption: string;
  };
  features: {
    eyebrow: string;
    title: string;
    introduction: string;
    items: readonly FeatureContent[];
  };
  privacy: {
    eyebrow: string;
    title: string;
    description: string;
    points: readonly string[];
    imageAlt: string;
    imageCaption: string;
  };
  developer: {
    eyebrow: string;
    title: string;
    profile: string;
  };
  closing: {
    title: string;
    description: string;
  };
  footer: {
    tagline: string;
  };
}
