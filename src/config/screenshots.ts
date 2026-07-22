import type { ImageMetadata } from 'astro';
import enDashboard from '../assets/screenshots/v2.2.0/en/dashboard.png';
import enCalendarProgress from '../assets/screenshots/v2.2.0/en/calendar-progress.png';
import enPrivacy from '../assets/screenshots/v2.2.0/en/privacy-details.png';
import enScheduleLoad from '../assets/screenshots/v2.2.0/en/schedule-load.png';
import enWeeklyReport from '../assets/screenshots/v2.2.0/en/weekly-report.png';
import jaDashboard from '../assets/screenshots/v2.2.0/ja/dashboard.png';
import jaCalendarProgress from '../assets/screenshots/v2.2.0/ja/calendar-progress.png';
import jaPrivacy from '../assets/screenshots/v2.2.0/ja/privacy-details.png';
import jaScheduleLoad from '../assets/screenshots/v2.2.0/ja/schedule-load.png';
import jaWeeklyReport from '../assets/screenshots/v2.2.0/ja/weekly-report.png';
import type { Locale, ScreenshotKey } from '../i18n/types';

interface ScreenshotSet {
  hero: ImageMetadata;
  privacy: ImageMetadata;
  features: Record<ScreenshotKey, ImageMetadata>;
}

export const screenshots = {
  ja: {
    hero: jaCalendarProgress,
    privacy: jaPrivacy,
    features: {
      today: jaScheduleLoad,
      dashboard: jaDashboard,
      weekly: jaWeeklyReport,
    },
  },
  en: {
    hero: enCalendarProgress,
    privacy: enPrivacy,
    features: {
      today: enScheduleLoad,
      dashboard: enDashboard,
      weekly: enWeeklyReport,
    },
  },
} satisfies Record<Locale, ScreenshotSet>;
