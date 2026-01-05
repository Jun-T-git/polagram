# @polagram/core 仕様書

この仕様書は、`packages/core/test/functional` 以下のテストケース (`feature_matrix.test.ts`, `docs_scenarios.test.ts`, `fluent.test.ts`, `fluent_plantuml.test.ts`, `plantuml_scenarios.test.ts`) に基づいて作成された、現在の実装が保証する機能と挙動のまとめです。

## 概要

`@polagram/core` は **Mermaid** および **PlantUML** シーケンス図を解析(Parse)、変換(Transform)、再生成(Generate)するためのライブラリです。Fluent API を提供し、直感的なメソッドチェーンによるダイアグラムの操作を可能にします。

## サポートされている図形式

- **Mermaid**: `.mmd`, `.mermaid` ファイル
- **PlantUML**: `.puml`, `.plantuml`, `.pu` ファイル

## API インターフェース

### 初期化と出力
- **`Polagram.init(code: string, format?: 'mermaid' | 'plantuml')`**: 図のコード文字列を受け取り、インスタンスを初期化します。
  - `format` を省略した場合は Mermaid として扱われます。
  - PlantUML を使用する場合は明示的に `'plantuml'` を指定してください。
- **`.toMermaid()`**: 変換後のダイアグラムを Mermaid コード文字列として出力します。
- **`.toPlantUML()`**: 変換後のダイアグラムを PlantUML コード文字列として出力します。
- **`.toAST()`**: 変換後の抽象構文木 (AST) オブジェクトを返します。
- **`.getSourceFormat()`**: 入力図の形式 (`'mermaid'` または `'plantuml'`) を返します。
- **`.applyLens(lens: Lens)`**: 定義済みの Lens オブジェクト（変換レイヤーの集合）を適用します。複数の Lens を連鎖させることも可能です。
- テストコード `roundtrip.test.ts` および `roundtrip_plantuml.test.ts` により、パース後の変更なしの再生成で情報の損失がないことが保証されています（空白の差異を除く）。

### メソッドチェーン
- 変換メソッド (`focusParticipant`, `removeParticipant`, `resolveFragment` 等) はチェーン可能であり、指定順序に従って適用されます。
- 例: `.resolveFragment(...)` でループを展開した後に `.removeParticipant(...)` で不要な要素を削除する、といった操作が可能です。

## セレクターと変換操作

### 1. Participant (参加者) の操作

#### アクション
- **`removeParticipant(selector)`**: 指定された参加者を削除します。その参加者が送受信するメッセージ、およびその参加者に対する Note も同時に削除されます。
- **`focusParticipant(selector)`**: 指定された参加者**のみ**を残し、それ以外を削除します。
    - フォーカスされた参加者同士のやり取りは保持されます。
    - フォーカスされていない参加者とのやり取りは削除されます。

#### セレクター
参加者は以下の条件で指定可能です：
- **ID**: 定義時の識別子（例: `participant A as Alice` の `A`）。
- **Name (Label)**: 表示名（例: `participant A as Alice` の `Alice`）。
- **RegExp**: 名前や ID に対する正規表現マッチング。
    - 単純な文字列を渡した場合は名前/IDへの完全一致または部分一致として扱われます（実装依存だがテストでは文字列と正規表現双方が使用されている）。
- **Stereotype**: `<<Service>>` などのステレオタイプ指定（※現状の Mermaid パーサーでは未サポートだが、将来的な互換性のためにテストケースが存在）。

### 2. Message (メッセージ) の操作

#### アクション
- **`removeMessage(selector)`**: 指定された条件に一致するメッセージを削除します。

#### セレクター
メッセージは以下の条件で指定可能です：
- **Pattern (Regex)**: メッセージテキストに対する正規表現（例: `^Log:` でログ出力を削除, `Error` でエラーメッセージを削除）。
- **From (Sender)**: 送信元参加者の ID/名前。
- **To (Receiver)**: 受信先参加者の ID/名前。

### 3. Fragment (フラグメント/複合要素) の操作

#### アクション
- **`resolveFragment(selector)`**: 指定されたフラグメント（Loop, Alt, Opt など）を「解決（Resolve）」します。
    - **解決の挙動**: フラグメントの枠組み（`loop ... end` 等）を削除し、その中身のメッセージを親レベルに展開（Unwrap）します。
    - ユースケース: 複雑な分岐のうち「正常系（Happy Path）」のみを残して可読性を上げたい場合などに使用します。

#### セレクター
- **Operator**: `loop`, `opt`, `alt` などの種類。
- **Condition**: フラグメントの条件テキスト（例: `Payment Success`, `Retry Policy`）。文字列または正規表現で指定可能。

### 4. Lens (レンズ) の適用

#### 概要
Lens は、特定の目的（例: "PM View", "Dev View"）のために定義された一連の変換操作（レイヤー）の集合です。YAML 形式などで外部定義された設定を一括適用する際に利用されます。

#### 構造 (Lens Object)
- **`name`**: レンズの名前。
- **`layers`**: 適用する変換レイヤーの配列。各レイヤーは `action` と `selector` を持ちます。

#### API/Util
- **`applyLens(lens)`**: `Polagram` インスタンスに Lens を適用します。既存のレイヤーの最後に追加されます。
- **`validateLens(lens)`**: オブジェクトが有効な Lens 構造を持っているかを検証するユーティリティ関数も存在します (テスト: `lens.test.ts`)。

## ユースケース・シナリオ (Scenarios)

テストケース `docs_scenarios.test.ts` で定義されている主要な利用パターンです。

### PM View (プロダクトマネージャー向けビュー)
技術的な詳細を隠蔽し、ビジネスロジックの概要を表示します。
1. **Remove Logs**: `^Log:` などのパターンで技術的なログ出力を削除。
2. **Resolve Happy Path**: `alt` や `opt` を特定の条件（例: `Payment Success`）で解決し、成功ルートのみを一本化して表示。
3. **Focus High-level Actors**: ユーザーや主要コンポーネントのみにフォーカスし、内部詳細を隠す。

### Dev View (開発者向けビュー)
特定のバックエンドサービスやコンポーネント間の連携に焦点を当てます。
1. **Focus Backend**: `API`, `Database` などのバックエンドコンポーネントにフォーカス。
    - これにより、フロントエンド（User, Web）からのノイズを排除しつつ、バックエンド間の通信（`API->>DB` 等）は詳細に保持する。
    - 必要に応じて内部ログなども残す（明示的に削除しない限り保持される）。

## クロスフォーマット変換

### Mermaid ⇔ PlantUML 変換
`@polagram/core` は Mermaid と PlantUML 間の相互変換をサポートしています。

#### 使用例
```typescript
// PlantUML → Mermaid
const mermaid = Polagram.init(plantumlCode, 'plantuml')
  .toMermaid();

// Mermaid → PlantUML
const plantuml = Polagram.init(mermaidCode, 'mermaid')
  .toPlantUML();

// 変換と変換を組み合わせ
const result = Polagram.init(plantumlCode, 'plantuml')
  .removeParticipant('Logger')
  .toMermaid();
```

#### サポートされている要素
- ✅ Participants (参加者)
- ✅ Messages (メッセージ)
- ✅ Fragments (alt, loop, opt)
- ✅ Activations (activate/deactivate)
- ✅ Notes (ノート)
- ⚠️ Participant Types (actor, database) - 部分的サポート

#### 制限事項
- PlantUML の `stereotype` (`<<Service>>`) は現在未サポート
- 一部の PlantUML 固有の構文は変換時に失われる可能性があります

## 制限事項・注意点
- **Stereotype**: PlantUML ライクなステレオタイプ記法（`<<Type>>`）のサポートは計画されていますが、現在の Mermaid パーサー実装ではまだ有効化されていません。
- **Box Grouping**: `box` によるグループ化の削除機能はテストコードに含まれていますが、現在の Mermaid ジェネレータが box を無視する場合があるため、一部機能は制限されている可能性があります（コメントアウトされたテストより）。
