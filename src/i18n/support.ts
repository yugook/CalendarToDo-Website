import type { Locale } from './types';

interface SupportLink {
  label: string;
  href: string;
}

interface SupportCard {
  title: string;
  description: string;
}

interface SupportFaq {
  question: string;
  paragraphs: readonly string[];
  links?: readonly SupportLink[];
}

export interface SupportContent {
  seo: {
    title: string;
    description: string;
  };
  title: string;
  introduction: string;
  updatedLabel: string;
  emailAction: string;
  basicSettings: {
    title: string;
    introduction: string;
    items: readonly SupportCard[];
  };
  externalCalendars: {
    title: string;
    paragraphs: readonly string[];
    steps: readonly string[];
    note: string;
    helpTitle: string;
    helpIntroduction: string;
    links: readonly SupportLink[];
  };
  faq: {
    title: string;
    items: readonly SupportFaq[];
  };
  troubleshooting: {
    title: string;
    items: readonly string[];
  };
  contact: {
    title: string;
    introduction: string;
    items: readonly string[];
    label: string;
  };
  legal: {
    title: string;
    introduction: string;
    privacy: string;
    terms: string;
  };
}

const jaSupport = {
  seo: {
    title: 'サポート – Calendar ToDo',
    description:
      'Calendar ToDoの使い方、よくある質問、トラブルシューティング、問い合わせ先をご案内します。',
  },
  title: 'Calendar ToDo サポート',
  introduction:
    'Calendar ToDoの使い方、よくある質問、トラブルシューティング、問い合わせ先をまとめています。',
  updatedLabel: '最終更新日',
  emailAction: 'メールで問い合わせる',
  basicSettings: {
    title: '基本設定の確認',
    introduction:
      '予定の表示、通知、同期に関係する代表的な設定です。問題がある場合は、以下の項目が手がかりになります。',
    items: [
      {
        title: 'カレンダーアクセス',
        description:
          'iOSの設定で、Calendar ToDoにカレンダーへのアクセスが許可されているか確認してください。',
      },
      {
        title: '通知',
        description:
          '通知を利用する場合は、iOSの通知設定と集中モードの状態を確認してください。',
      },
      {
        title: 'iCloud同期',
        description:
          '同期を利用する場合は、同じApple Account（Apple ID）でiCloudにサインインし、iCloud Driveが有効か確認してください。',
      },
    ],
  },
  externalCalendars: {
    title: '外部カレンダーの表示について',
    paragraphs: [
      'Calendar ToDoはGoogleカレンダーやOutlookに直接ログインするのではなく、iOS標準のカレンダーアプリに同期されている予定を読み取って表示します。',
      'GoogleカレンダーやOutlookの予定を表示するには、iOS側で対象アカウントのカレンダー同期が有効になっている必要があります。',
    ],
    steps: [
      'iOSの「設定」でGoogleまたはOutlookのアカウントを追加します。',
      '対象アカウントのカレンダー同期を有効にします。',
      'iOS標準のカレンダーアプリで予定が表示されることを確認します。',
      'Calendar ToDoにカレンダーアクセスを許可します。',
      'Calendar ToDo内で対象カレンダーが非表示になっていないか確認します。',
    ],
    note: '設定画面の名称や手順は、iOSのバージョンやアカウントの種類により異なる場合があります。',
    helpTitle: '関連する公式ヘルプ',
    helpIntroduction:
      '詳しい設定手順は、Apple、Google、Microsoftの公式ヘルプもあわせて確認してください。',
    links: [
      {
        label: 'Apple：iPhoneでカレンダーアカウントを設定する',
        href: 'https://support.apple.com/ja-jp/guide/iphone/ipha0d932e96/ios',
      },
      {
        label: 'Google：GoogleカレンダーをAppleカレンダーに追加する',
        href: 'https://support.google.com/calendar/answer/99358?co=GENIE.Platform%3DiOS&hl=ja',
      },
      {
        label: 'Microsoft：OutlookとiPhoneカレンダーを接続する',
        href: 'https://support.microsoft.com/en-us/office/connect-outlook-and-apple-iphone-calendars-be7a12eb-fe76-4346-ae13-b54249db7f9c',
      },
    ],
  },
  faq: {
    title: 'よくある質問',
    items: [
      {
        question: 'カレンダーの予定が表示されません。',
        paragraphs: [
          'iOSの「設定」からCalendar ToDoのカレンダーアクセスを許可してください。許可後も表示されない場合は、アプリを再起動し、対象のカレンダーが非表示になっていないか確認してください。',
        ],
      },
      {
        question: 'GoogleカレンダーやOutlookの予定を表示できますか。',
        paragraphs: [
          'はい。GoogleカレンダーやOutlookの予定は、iOS標準のカレンダーアプリに同期されていればCalendar ToDoで表示できます。Calendar ToDoがGoogleカレンダーやOutlookへ直接ログインすることはありません。',
        ],
      },
      {
        question: 'GoogleカレンダーやOutlookの予定が表示されません。',
        paragraphs: [
          'まずiOS標準のカレンダーアプリで対象の予定が表示されるか確認してください。表示されない場合は、iOS側でGoogleまたはOutlookアカウントのカレンダー同期が有効になっているか確認してください。iOS標準のカレンダーアプリでは表示されるのにCalendar ToDoで表示されない場合は、Calendar ToDoのカレンダーアクセスと表示対象カレンダーを確認してください。',
        ],
      },
      {
        question: 'GoogleカレンダーやOutlookで設定した予定ごとの色は表示されますか。',
        paragraphs: [
          'Calendar ToDoでは、予定が所属するカレンダーごとの色を表示します。Googleカレンダーの色ラベルやOutlookのカテゴリ色など、予定ごとに設定した色は、iOS標準のカレンダーアプリ経由ではCalendar ToDoに反映されません。',
          '予定を色分けして管理したい場合は、予定ごとの色ではなく、用途ごとにカレンダーを分けることをおすすめします。',
          '関連する公式ヘルプ：',
        ],
        links: [
          {
            label: 'Apple：iPhoneで複数のカレンダーを設定する',
            href: 'https://support.apple.com/ja-jp/guide/iphone/iph3d1110d4/ios',
          },
          {
            label: 'Google：新しいカレンダーを作成する',
            href: 'https://support.google.com/calendar/answer/37095?hl=ja',
          },
          {
            label: 'Google：色ラベルを使用してカレンダーの予定を管理する',
            href: 'https://support.google.com/calendar/answer/12377581?hl=ja',
          },
        ],
      },
      {
        question: 'カレンダーの予定を編集できますか。',
        paragraphs: [
          'Calendar ToDoでは、元のカレンダー予定のタイトル、時刻、場所、メモなどは編集できません。予定は読み取り専用で表示され、完了状態や振り返りの記録はCalendar ToDo内のデータとして保存されます。',
          '予定そのものを変更したい場合は、iOS標準のカレンダーアプリ、Googleカレンダー、Outlookなど、予定を作成したカレンダー側で編集してください。',
        ],
      },
      {
        question: '予定を完了にすると、元のカレンダーイベントも変更されますか。',
        paragraphs: [
          '変更されません。Calendar ToDoはカレンダーイベントを読み取り専用で表示し、完了状態はアプリ内のデータとして記録します。',
        ],
      },
      {
        question: 'iCloud同期が反映されません。',
        paragraphs: [
          '同じApple Account（Apple ID）でサインインしていること、iCloud Driveが有効であること、通信環境が安定していることを確認してください。同期には時間がかかる場合があります。',
        ],
      },
      {
        question: 'アプリを削除するとデータはどうなりますか。',
        paragraphs: [
          '端末内のアプリデータは削除されます。iCloud上のデータも削除したい場合は、iOSの設定から本アプリのiCloudデータを削除してください。画面名や手順はiOSのバージョンにより異なる場合があります。',
        ],
      },
      {
        question: 'サブスクリプションはどこで管理できますか。',
        paragraphs: [
          'App Storeのサブスクリプション管理画面、またはiOSの「設定」からApple IDのサブスクリプションを開いて管理してください。決済と解約はAppleが提供する仕組みで処理されます。',
        ],
      },
    ],
  },
  troubleshooting: {
    title: 'トラブルシューティング',
    items: [
      'App StoreでCalendar ToDoが最新版か確認してください。',
      'iOSの設定でカレンダー権限、通知設定、iCloud設定を確認してください。',
      'アプリを終了して再起動してください。',
      '端末を再起動してください。',
      '特定のカレンダーだけ表示されない場合は、iOS標準のカレンダーアプリ側で対象カレンダーが有効か確認してください。',
      'GoogleカレンダーやOutlookの予定が表示されない場合は、iOS側で対象アカウントのカレンダー同期が有効か確認してください。',
    ],
  },
  contact: {
    title: 'お問い合わせ',
    introduction: '解決しない場合は、以下の情報を添えてお問い合わせください。',
    items: [
      '端末名',
      'iOSバージョン',
      'Calendar ToDoのアプリバージョン',
      '発生した問題と再現手順',
      '必要に応じてスクリーンショット',
    ],
    label: '連絡先',
  },
  legal: {
    title: 'プライバシーと法務',
    introduction:
      'カレンダー情報の扱い、iCloud同期、サブスクリプションに関する詳細は以下をご確認ください。',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
  },
} satisfies SupportContent;

const enSupport = {
  seo: {
    title: 'Support – Calendar ToDo',
    description:
      'Find help for Calendar ToDo, including common questions, troubleshooting steps, and contact information.',
  },
  title: 'Calendar ToDo Support',
  introduction:
    'Find help for Calendar ToDo, including common questions, troubleshooting steps, and contact information.',
  updatedLabel: 'Last updated',
  emailAction: 'Email support',
  basicSettings: {
    title: 'Basic Settings',
    introduction:
      'These are common settings related to event display, notifications, and sync. If something is not working as expected, the items below may help narrow it down.',
    items: [
      {
        title: 'Calendar Access',
        description:
          'Make sure Calendar ToDo is allowed to access calendars in iOS Settings.',
      },
      {
        title: 'Notifications',
        description:
          'If you use notifications, check iOS notification settings and Focus mode status.',
      },
      {
        title: 'iCloud Sync',
        description:
          'If sync is enabled, make sure you are signed in with the same Apple Account (Apple ID) and iCloud Drive is enabled.',
      },
    ],
  },
  externalCalendars: {
    title: 'Showing External Calendars',
    paragraphs: [
      'Calendar ToDo does not sign in to Google Calendar or Outlook directly. It reads events that are synced to the built-in iOS Calendar app.',
      'To show Google Calendar or Outlook events, first enable calendar sync for that account in iOS Settings.',
    ],
    steps: [
      'Add your Google or Outlook account in iOS Settings.',
      'Enable calendar sync for that account.',
      'Confirm that the events appear in the built-in iOS Calendar app.',
      'Allow Calendar access for Calendar ToDo.',
      'Check that the target calendar is not hidden in Calendar ToDo.',
    ],
    note: 'Setting names and steps may vary depending on your iOS version and account type.',
    helpTitle: 'Related Official Help',
    helpIntroduction:
      'For detailed setup steps, please refer to the official help pages from Apple, Google, or Microsoft.',
    links: [
      {
        label: 'Apple: Set up calendar accounts on iPhone',
        href: 'https://support.apple.com/guide/iphone/ipha0d932e96/ios',
      },
      {
        label: 'Google: Add Google Calendar to Apple Calendar',
        href: 'https://support.google.com/calendar/answer/99358?co=GENIE.Platform%3DiOS&hl=en',
      },
      {
        label: 'Microsoft: Connect Outlook and Apple iPhone calendars',
        href: 'https://support.microsoft.com/en-us/office/connect-outlook-and-apple-iphone-calendars-be7a12eb-fe76-4346-ae13-b54249db7f9c',
      },
    ],
  },
  faq: {
    title: 'FAQ',
    items: [
      {
        question: 'My calendar events are not displayed.',
        paragraphs: [
          'Allow Calendar access for Calendar ToDo in iOS Settings. If events still do not appear, restart the app and confirm that the target calendar is not hidden.',
        ],
      },
      {
        question: 'Can I show Google Calendar or Outlook events?',
        paragraphs: [
          'Yes. Calendar ToDo can show Google Calendar or Outlook events when they are synced to the built-in iOS Calendar app. Calendar ToDo does not sign in to Google Calendar or Outlook directly.',
        ],
      },
      {
        question: "Why aren't my Google Calendar or Outlook events showing?",
        paragraphs: [
          'First, confirm that the events appear in the built-in iOS Calendar app. If they do not appear there, check that calendar sync is enabled for your Google or Outlook account in iOS Settings. If the events appear in the built-in Calendar app but not in Calendar ToDo, check Calendar access and the visible calendars in Calendar ToDo.',
        ],
      },
      {
        question: 'Are per-event colors from Google Calendar or Outlook shown?',
        paragraphs: [
          'Calendar ToDo shows the color of the calendar that each event belongs to. Per-event colors, such as Google Calendar color labels or Outlook category colors, are not available in Calendar ToDo through the built-in iOS Calendar system.',
          'If you want to organize events by color, we recommend creating separate calendars for different purposes instead of using per-event colors.',
          'Related official help:',
        ],
        links: [
          {
            label: 'Apple: Set up multiple calendars on iPhone',
            href: 'https://support.apple.com/guide/iphone/iph3d1110d4/ios',
          },
          {
            label: 'Google: Create a new calendar',
            href: 'https://support.google.com/calendar/answer/37095?hl=en',
          },
          {
            label: 'Google: Use color labels to track calendar entries',
            href: 'https://support.google.com/calendar/answer/12377581?hl=en',
          },
        ],
      },
      {
        question: 'Can I edit calendar events in Calendar ToDo?',
        paragraphs: [
          'No. Calendar ToDo does not modify the original calendar event title, time, location, notes, or other calendar details. Calendar ToDo displays calendar events as read-only and stores done status and reflection records as app data.',
          'If you want to change the event itself, please edit it in the built-in iOS Calendar app, Google Calendar, Outlook, or the calendar service where the event was created.',
        ],
      },
      {
        question: 'Does marking an event as done change the original calendar event?',
        paragraphs: [
          'No. Calendar ToDo displays calendar events as read-only. Done status is stored as app data.',
        ],
      },
      {
        question: 'iCloud sync is not updating.',
        paragraphs: [
          'Confirm that all devices use the same Apple Account (Apple ID), iCloud Drive is enabled, and your network connection is stable. Syncing may take some time.',
        ],
      },
      {
        question: 'What happens to my data if I delete the app?',
        paragraphs: [
          "Local app data is removed from the device. To remove iCloud data as well, delete this app's iCloud data in iOS Settings. Labels and steps may vary by iOS version.",
        ],
      },
      {
        question: 'Where can I manage my subscription?',
        paragraphs: [
          'Manage subscriptions in the App Store or from Apple ID subscriptions in iOS Settings. Payments and cancellations are handled by Apple.',
        ],
      },
    ],
  },
  troubleshooting: {
    title: 'Troubleshooting',
    items: [
      'Check the App Store for the latest version of Calendar ToDo.',
      'Review Calendar access, notification settings, and iCloud settings in iOS Settings.',
      'Quit and reopen the app.',
      'Restart your device.',
      'If only a specific calendar is missing, check whether that calendar is enabled in the built-in iOS Calendar app.',
      'If Google Calendar or Outlook events are missing, confirm that calendar sync is enabled for that account in iOS Settings.',
    ],
  },
  contact: {
    title: 'Contact',
    introduction:
      'If the issue continues, please include the following details when contacting support.',
    items: [
      'Device model',
      'iOS version',
      'Calendar ToDo app version',
      'Problem description and steps to reproduce',
      'Screenshots if helpful',
    ],
    label: 'Contact',
  },
  legal: {
    title: 'Privacy and Legal',
    introduction:
      'For details about calendar data, iCloud sync, and subscriptions, see the following pages.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  },
} satisfies SupportContent;

export const supportContent = {
  ja: jaSupport,
  en: enSupport,
} as const satisfies Record<Locale, SupportContent>;
