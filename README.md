# Calendar ToDo Website

Calendar ToDo公式サイトのソースコードです。AstroのMinimal構成を使用した、UIフレームワークを含まない静的サイトです。

- 日本語: `/`
- English: `/en/`

## 必要な環境

- Node.js 24.18.0（`.nvmrc`）
- npm 11系

## 開発

```sh
nvm use
npm install
npm run dev
```

## 検証

```sh
npm run check
npm run build
```

## ディレクトリ

- `src/pages`: 言語別のルート
- `src/components`: 日英で共有するページ・サイト部品
- `src/i18n`: 型付きの日本語・英語コンテンツ
- `src/assets/screenshots`: Webサイトで使用する言語別の実画面
- `assets/branding`: アプリアイコンなどのブランド原本（サイトのビルド対象外）
- `assets/marketing/app-store`: App Store用に加工した原寸素材（サイトのビルド対象外）
- `public/og`: 言語別のOpen Graph画像

## Cloudflare Pages

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node.js version: `24.18.0`

App Storeの地域別URLは、`src/config/site.ts`の`APP_STORE_URLS`で管理しています。
