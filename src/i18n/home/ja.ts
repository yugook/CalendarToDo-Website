import type { HomeContent } from '../types';

export const jaHome = {
  seo: {
    title: 'Calendar ToDo – 予定の完了記録と振り返り',
    description:
      'Calendar ToDoは、カレンダー予定に完了・進捗を記録し、日次・週次で振り返るためのiOSアプリです。',
    imageAlt:
      'Calendar ToDo — 予定を入れるだけで、終わらせない。',
  },
  accessibility: {
    skipLink: '本文へ移動',
  },
  navigation: {
    label: 'メインナビゲーション',
    footerLabel: 'フッターナビゲーション',
    homeLabel: 'Calendar ToDo トップへ',
    languageLabel: '表示言語',
    features: '特徴',
    privacy: 'プライバシー',
    developer: '開発者',
  },
  store: {
    compactLabel: 'App Store',
    buttonLabel: 'App Storeで見る',
    ariaLabel: 'App StoreでCalendar ToDoを見る（新しいタブで開く）',
    note: 'iPhoneでご利用いただけます。',
  },
  hero: {
    eyebrow: 'Calendar ToDo for iPhone',
    title: '予定を入れるだけで、終わらせない。',
    subtitle: 'カレンダー予定を、実行記録と振り返りに変える。',
    description:
      'iOS標準カレンダーの予定を読み取り、予定ごとに完了・部分進捗・未チェック・振り返りを記録するiOSアプリです。いつものカレンダーを、そのまま実行ログとして活用できます。',
    supportedCalendarsLabel: '対応カレンダー',
    supportedCalendars: ['iCloud', 'Google Calendar', 'Outlook'],
    imageAlt:
      '月間カレンダー上で、選択した日の予定ごとに完了や進捗を記録しているCalendar ToDoの画面',
    imageCaption: 'いつものカレンダーに、実行の記録を重ねます。',
  },
  features: {
    eyebrow: 'Features',
    title: '計画のあとまで、ひとつの場所で。',
    introduction:
      '今日の予定を確認し、実行したことを記録する。日々の積み重ねから、週の変化まで自然につながります。',
    items: [
      {
        screenshot: 'today',
        title: '今日の予定量を、すぐ把握',
        description:
          '今日と直近の予定を一覧で確認。予定の詰まり具合や、これから取り組むことがひと目でわかります。',
        imageAlt:
          '今日の予定一覧と時間帯ごとの予定量を表示するCalendar ToDoの画面',
        imageCaption: '予定の量と時間帯を確認',
      },
      {
        screenshot: 'dashboard',
        title: '続けた日々を、見える化',
        description:
          'ヒートマップで完了や記録の積み重ねを確認。習慣や変化を、長い目で振り返れます。',
        imageAlt:
          '記録の継続をヒートマップで表示するCalendar ToDoのダッシュボード画面',
        imageCaption: '日々の積み重ねをヒートマップで確認',
      },
      {
        screenshot: 'weekly',
        title: '1週間の動きを、まとめて確認',
        description:
          '予定と実績を週単位で振り返り、できたことや残ったことを次の計画へつなげます。',
        imageAlt:
          '1週間の完了率や予定数をまとめたCalendar ToDoの週次レポート画面',
        imageCaption: '予定と実績を週単位で振り返り',
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'カレンダーは、そのまま。',
    description:
      'Calendar ToDoは、許可したカレンダーの予定を読み取り、進捗や振り返りを記録します。カレンダー予定そのものは編集しません。',
    points: [
      'iOS標準カレンダーから、アクセスを許可した予定を読み取ります。',
      'Calendar ToDoから予定の作成・変更・削除は行いません。',
      '記録はアプリ内に保存され、iCloud同期を使う場合は利用者のiCloudに保存されます。予定内容や記録を開発者のサーバーへ送信しません。',
      'カレンダーへのアクセスは、iOSの設定からいつでも変更できます。',
    ],
    imageAlt:
      'Calendar ToDoのカレンダーアクセスとプライバシーについて説明する画面',
    imageCaption: '必要なアクセス内容をアプリ内で案内',
  },
  developer: {
    eyebrow: 'Developer',
    title: '開発者について',
    profile:
      'Calendar ToDoを開発し、カレンダー予定を実行記録と振り返りに変える仕組みをつくるiOSエンジニアです。',
  },
  closing: {
    title: '予定と実績を、同じカレンダーで。',
    description:
      '新しい予定表を増やさず、いつものカレンダーから始められます。',
  },
  footer: {
    tagline: 'カレンダー予定を、実行記録と振り返りに。',
  },
} satisfies HomeContent;
