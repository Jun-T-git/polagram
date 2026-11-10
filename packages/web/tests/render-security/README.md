# Mermaid描画の回帰試験

`pnpm --filter @polagram/web test` で、実コンポーネントをViteとChromiumで実行する。事前に `pnpm --filter @polagram/web exec playwright install chromium` が必要。既存ブラウザを使う場合は `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` で実行ファイルを指定できる。

正常図と構文エラーからの復帰には実Mermaidを使う。例外文のHTML扱いと非同期の順序だけはMermaidのrenderを制御し、例外・遅い成功・遅い失敗を決定的に再現する。HTMLのfixtureは存在しない画像とテスト用フラグのみを使い、外部サービス・認証・個人データへアクセスしない。

修正前との比較は、コンポーネントだけを指定commitからViteへ読み込ませる。作業中のソースファイルは書き換えない。以下は修正前の基準版（失敗が期待結果）。

```sh
POLAGRAM_RENDER_BASELINE=526c8895b3dd21043602217ac66df6f5db328691 pnpm --filter @polagram/web test
```

結果のartifactは `/tmp/polagram-render-results` に置く。通常のNext.js E2Eとは別設定で実行し、既存のE2Eではこのディレクトリを除外する。

`preview-smoke.spec.ts` はbuild済みのCLIを一時プロジェクトと空きポートで起動し、入れ子パスの図を開く→lens適用→存在しない図のエラー→正常図への復帰を確認する。単独実行前には `pnpm --filter @polagram/cli... build` を実行する。終了時に自分が起動したCLIと一時fixtureを削除する。
