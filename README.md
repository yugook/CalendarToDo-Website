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
npm run check:dist
npm run test:automation
npm run test:smoke
```

`check:dist`はビルド後に実行し、日英のページと404、ポリシーJSON、サイトマップ、Cloudflare用ヘッダーの生成を確認します。Cloudflare上のレスポンスヘッダーやブラウザー表示は、後述のプレビュー検証で確認します。

`test:smoke`はビルド後に実行します。一時的なローカルサーバーを自動起動・停止し、日英8ページ、言語リンク、ポリシーJSON、404、画像・CSS・JavaScriptの配信と`_headers`のコピーを検証します。追加のサービスや認証情報は不要です。

GitHub ActionsのCIはすべてのPR、`main`へのpush、手動実行で同じ検証を行います。Node.jsは`.nvmrc`を使用し、依存関係は`npm ci`でインストールします。ブランチ保護でCIを必須にする場合は、`Validate`を必須チェックに指定してください。

## 依存関係の更新

DependabotがnpmとGitHub Actionsを毎週月曜03:00 UTCに確認します。通常の更新PRはエコシステムごとに最大5件とし、まとめずに個別に作成します。メジャー更新も検知対象に残します。

- npmのパッチ更新だけをオートマージ対象にします。複数の依存を含むセキュリティ更新では、すべてがパッチ更新であることが条件です。
- マイナー・メジャー更新、`0.x`のマイナー更新、プレリリース、GitHub Actions更新は手動レビューします。
- 自動マージはコミットが1件のPRに限ります。追加コミットがあるPRは、元のDependabot更新がパッチ更新でも手動レビューします。
- セキュリティ更新も同じ分類を適用し、自動化の対象外なら優先してレビューします。
- `sharp`などの開発依存も画像生成やビルドに影響するため、開発依存という理由だけで検証を省略しません。

CIの`Validate`は、`.nvmrc`のNode.jsを使用し、`npm ci`、自動マージ判定のテスト、型チェック、ビルド、生成物の確認、配信テストを実行します。ActionsはコミットSHAに固定し、その更新もDependabotで検知します。

### Dependabot PRを最新化する運用

DependabotのPRでは、GitHubの`Update branch`による`main`のマージや、PRブランチへの手動コミットを避けます。マージコミットもPR内のコミット数に含まれ、コミットが2件以上になると自動マージの対象外になります。PRを`main`へ取り込むときに作られるマージコミットは、この制限とは別です。

Dependabotの自動rebaseは既定で有効です。定期チェックや競合の検出などを契機に最新化しますが、`main`のすべての更新に即座に追従する保証はありません。追加コミットが入ったPRや、作成から30日経過したPRでは、自動rebaseが停止します。詳しくは[GitHubのDependabot PR運用ガイド](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/manage-dependabot-prs)を確認してください。

最新化を依頼する場合は、次の順で対応します。

1. PRに`@dependabot rebase`とコメントします。
2. 手動変更を理由に拒否された場合は、PRの差分を確認します。保持すべき変更がある場合は別途保存してレビューし、上書きしてよいことを確認してから`@dependabot recreate`を依頼します。`recreate`はPRブランチ上の手動変更を上書きするため、自動では実行しません。
3. 新しいhead SHAについて、PR内のコミット数が1件、署名が`Verified`、`Validate`と`Cloudflare Pages`が成功していることを確認します。その後、`Dependabot auto-merge`のSummaryとPR上の自動マージ状態を確認します。手動rebaseで署名を付け直した場合も、署名とメタデータの検証を再確認します。

`Dependabot auto-merge`のSummaryには、判定対象のhead SHA、結果、理由、次の対応を表示します。対象外のPRは自動マージせず正常終了するため、Actionsの成功表示だけで自動マージが設定されたとは判断しません。「自動マージを要求しました」という結果も、マージ完了とは区別してください。APIやコマンドが失敗した場合は、失敗した実行のSummaryとログを確認します。

### オートマージの初期設定

**初期状態は無効です。** このPRのマージだけではオートマージは有効になりません。次の順で導入します。

1. PR上で`Validate`と`Cloudflare Pages`の成功を確認し、この設定を手動で`main`へマージします。
2. GitHubのSettings → Rules → Rulesetsから既存の`main`ルールを編集します。署名・PR必須・会話解決・削除禁止・force push禁止の設定は維持し、次を追加します。
   - Require status checks to pass: `Validate`（提供元GitHub Actions、App ID `15368`）と`Cloudflare Pages`（提供元Cloudflare Workers and Pages、App ID `85455`）。提供元を`Any source`にせず、各アプリに限定します。
   - Require branches to be up to date before merging: 有効。
3. Settings → General → Pull Requestsで`Allow auto-merge`を有効にします。これはGitHub側で自動マージを許可する設定で、後述のリポジトリ変数とは別に必要です。
4. Settingsのセキュリティ設定でDependency graph、Dependabot alerts、Dependabot security updatesを有効にします。セキュリティ更新は週次の通常更新とは別に処理されます。
5. Settings → Secrets and variables → Actions → Variablesに、リポジトリ変数`DEPENDABOT_AUTO_MERGE_ENABLED`を値`true`で追加します。
6. 最初のDependabotパッチPRで、署名・両チェック・merge commitでのマージを確認します。既存PRを評価し直す場合は、オートマージ用ワークフローを再実行するかPRを再オープンします。

オートマージ用ワークフローは`pull_request_target`で動作し、PRのコードをcheckoutしたり依存をインストールしたりしません。Dependabot作成・同一リポジトリ・`main`向けで、コミットが1件のPRに限定し、Dependabotのコミット署名と更新情報、`package.json` / `package-lock.json`以外を変更していないことを確認します。署名・更新情報の取得に使うアクションは先頭コミットだけを検証するため、コミットが1件であることとhead SHAが一致することを組み合わせ、検証対象をPRの変更全体に一致させます。コミット数が取得できない場合も自動マージしません。さらにGitHub APIで有効なブランチルールを読み、上記の必須チェック・最新ブランチ必須・署名・PR必須を確認できない場合は自動マージしません。

条件を満たすPRだけに、確認したhead SHAを指定して`gh pr merge --auto --merge`を実行します。チェック完了前ならGitHubのオートマージで待機し、完了済みならその時点でマージします。署名・会話解決などのルールを迂回せず、自動承認も行いません。PRの更新時は、このワークフローが以前設定したオートマージを解除してから判定し直します。検証失敗や対象外の更新は手動レビューに残します。

### 停止・問題発生時

リポジトリ変数`DEPENDABOT_AUTO_MERGE_ENABLED`を削除するか`false`にし、**すでに待機中のPRのオートマージもGitHub上で解除**します。変数の変更だけでは既存の待機要求は取り消されません。再実行時には、このワークフローが設定した待機要求も解除します。手動で設定したオートマージは変更しません。

失敗した更新は手動で修正・再検証し、マージ後に問題が見つかった場合は該当するmerge commitのrevert PRを作成します。必須チェックや署名ルールは解除しません。Astroや画像処理の更新では、ビルド成功だけで表示の互換性を判断せず、必要に応じてCloudflareプレビューで日英表示・画像・言語切替を確認します。

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
