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
npm run test:smoke
```

`test:smoke`はビルド後に実行します。一時的なローカルサーバーを自動起動・停止し、日英8ページ、言語リンク、ポリシーJSON、404、画像・CSS・JavaScriptの配信と`_headers`のコピーを検証します。追加のサービスや認証情報は不要です。

GitHub ActionsのCIはすべてのPR、`main`へのpush、手動実行で同じ検証を行います。Node.jsは`.nvmrc`を使用し、依存関係は`npm ci`でインストールします。ブランチ保護でCIを必須にする場合は、`Site checks`を必須チェックに指定してください。

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

### セキュリティヘッダー

`public/_headers`をビルド時に`dist/_headers`へコピーし、Cloudflare Pagesの静的レスポンスに適用します。`X-Frame-Options: DENY`で埋め込みを禁止し、`Permissions-Policy`でカメラ・マイク・位置情報へのアクセスを無効にしています。

CSPは`Content-Security-Policy-Report-Only`で導入しています。この段階では違反を報告するだけで、コンテンツの読み込みは遮断しません。スクリプトとスタイルは外部ファイルとして出力し、インライン実行の許可は加えていません。

Cloudflareのプレビュー環境で、次を確認してから強制適用へ進めます。Astroの開発・プレビューサーバーでは`_headers`が適用されないため、ビルド成功だけでは公開ヘッダーの検証になりません。

1. `npm run check`と`npm run build`が成功し、`public/_headers`と`dist/_headers`が一致する。
2. プレビューURLのトップ・サポート・規約・プライバシーの日英ページ、`/404.html`、`/legal/policy.json`、存在しないパスの応答ヘッダーを確認する。
3. ブラウザーのConsoleでCSP違反を確認し、画像・スタイルの表示、言語切替時のセクションとスクロール位置の復元を確認する。Cloudflare側でスクリプトが自動挿入される場合も、ここで影響を確認する。
4. 必要な修正と確認が完了したら、`_headers`のヘッダー名を`Content-Security-Policy`に変更し、同じ項目を再確認する。

現在はCSPレポートの収集先を設定していません。違反はブラウザーで確認し、集中収集が必要になった場合は実際の受信先を用意してから設定を追加します。

App Storeの地域別URLは、`src/config/site.ts`の`APP_STORE_URLS`で管理しています。
