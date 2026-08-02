import type { HomeContent } from '../types';

export const enHome = {
  seo: {
    title: 'Calendar ToDo – Track Progress and Reflect',
    description:
      'Calendar ToDo is an iOS app for tracking completion and progress on calendar events, then reflecting on your days and weeks.',
    imageAlt:
      'Calendar ToDo calendar showing progress recorded for each event.',
  },
  accessibility: {
    skipLink: 'Skip to content',
  },
  navigation: {
    label: 'Main navigation',
    footerLabel: 'Footer navigation',
    homeLabel: 'Calendar ToDo home',
    languageLabel: 'Display language',
    features: 'Features',
    privacy: 'Privacy',
    developer: 'Developer',
  },
  store: {
    compactLabel: 'App Store',
    buttonLabel: 'View on the App Store',
    ariaLabel: 'View Calendar ToDo on the App Store (opens in a new tab)',
    note: 'Available on iPhone and iPad.',
  },
  hero: {
    eyebrow: 'Calendar ToDo',
    title: "Don't let your plans end on the calendar.",
    subtitle: 'Turn calendar events into a record of action and reflection.',
    description:
      'Calendar ToDo reads events from the iOS Calendar and lets you record completion, partial progress, unchecked items, and reflections for each one. Keep using the calendars you already use—now as a record of what you actually did.',
    supportedCalendarsLabel: 'Works with',
    supportedCalendars: ['iCloud', 'Google Calendar', 'Outlook'],
    imageAlt:
      'Calendar ToDo showing a month calendar with completion and progress recorded for the selected day',
    imageCaption: 'Add a record of action to the calendar you already use.',
  },
  features: {
    eyebrow: 'Features',
    title: 'One place for the plan—and what happened next.',
    introduction:
      'See what is coming up, record what you did, and connect the details of each day to the shape of your week.',
    items: [
      {
        screenshot: 'today',
        title: "See today's load at a glance",
        description:
          'View today and the days ahead in one list. See how your schedule is distributed before you begin.',
        imageAlt:
          "Calendar ToDo showing today's events and the amount of scheduled time throughout the day",
        imageCaption: 'See your schedule and workload together',
      },
      {
        screenshot: 'dashboard',
        title: 'Make consistency visible',
        description:
          'Use the heatmap to see the record you are building over time and notice changes in your habits.',
        imageAlt:
          'Calendar ToDo dashboard showing a heatmap of recorded activity over time',
        imageCaption: 'See your activity build over time',
      },
      {
        screenshot: 'weekly',
        title: 'Review your week in one place',
        description:
          'Compare your plans with your results, then carry what you learned into the week ahead.',
        imageAlt:
          'Calendar ToDo weekly report showing completion rate and event totals',
        imageCaption: 'Reflect on plans and results by week',
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Your calendar stays your calendar.',
    description:
      'Calendar ToDo reads events from the calendars you allow and adds your progress and reflections in the app. It does not edit the calendar events themselves.',
    points: [
      'It reads events you allow through the iOS Calendar permission.',
      'It does not create, change, or delete your calendar events.',
      "Records stay in the app, or in your iCloud when iCloud sync is enabled. Event contents and records are not sent to the developer's server.",
      'You can change calendar access at any time in iOS Settings.',
    ],
    imageAlt:
      'Calendar ToDo screen explaining calendar access and privacy',
    imageCaption: 'Clear information about the access the app needs',
  },
  developer: {
    eyebrow: 'Developer',
    title: 'About the developer',
    profile:
      'I develop Calendar ToDo and build tools that turn calendar events into a record of action and reflection.',
  },
  closing: {
    title: 'Keep plans and results on the same calendar.',
    description:
      'Start with the calendar you already use—no new planning system required.',
  },
  footer: {
    tagline: 'Turn calendar events into a record of action and reflection.',
  },
} satisfies HomeContent;
