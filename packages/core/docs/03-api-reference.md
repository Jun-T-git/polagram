# Polagraph Core API リファレンス

`@polagraph/core` は、シーケンス図（Mermaid等）をプログラムで操作するためのコアライブラリです。
「解析(Parse) → 変換(Transform) → 生成(Generate)」のパイプラインを提供します。

## 目次

1.  [コンセプト](#1-コンセプト)
2.  [クイックスタート (Fluent API)](#2-クイックスタート-fluent-api)
3.  [変換機能: Layerによる操作](#3-変換機能-layerによる操作)
    *   [Resolve (構造の解決)](#resolve-構造の解決)
    *   [Focus (Participantの絞り込み)](#focus-participantの絞り込み)
    *   [Remove (要素の削除)](#remove-要素の削除)
    *   [Lens (レイヤーセット)](#lens-レイヤーセット)
4.  [セレクター仕様 (Selectors)](#4-セレクター仕様-selectors)
5.  [型定義リファレンス](#5-型定義リファレンス)

---

## 1. コンセプト

Polagraph はシーケンス図を **AST (抽象構文木)** として扱います。テキストとして置換するのではなく、構造を理解して操作するため、壊れにくい安全な変換が可能です。

*   **Builder Pattern**: メソッドチェーンで直感的に操作を記述できます。
*   **Layer (層)**: 変換処理の単位です。`resolve` / `focus` / `remove` の3つのアクションがあります。
*   **Lens**: 複数の Layer をまとめた「ビュー（視点）」の概念です。

---

## 2. クイックスタート (Fluent API)

最も標準的な利用方法です。

```typescript
import { Polagraph } from '@polagraph/core';

const mermaidCode = `...`; // ソースコード

const output = Polagraph.init(mermaidCode)
    .resolveFragment('Success')   // "Success" ルートを選択して分岐を解消
    .focusParticipant('DB')       // DBに関連するやり取りのみにフォーカス
    .removeParticipant('Logger')  // Loggerは明示的に除外
    .toMermaid();                 // Mermaid形式で出力

console.log(output);
```

---

## 3. 変換機能: Layerによる操作

### Resolve (構造の解決)

特定の分岐（`alt`, `loop`, `opt` など）を「解決」し、簡略化します。
選択された分岐の中身を親階層に引き上げ（Promote）、分岐構造自体は削除します。

#### `.resolveFragment(selector)`

*   **Action**: `resolve`
*   **Target**: `FragmentSelector`

```typescript
// "Success" という条件の分岐を選択して解決する
.resolveFragment('Success')

// 正規表現も使用可能
.resolveFragment(/^200 OK/)
```

### Focus (Participantの絞り込み)

特定の登場人物（Participant）に着目し、それ以外のノイズを隠します。
**Focus に選ばれなかった Participant と、それに関連するメッセージは非表示になります。**

#### `.focusParticipant(selector)`

*   **Action**: `focus`
*   **Target**: `ParticipantSelector`

```typescript
// "Service" という名前を含む Participant にフォーカス
.focusParticipant('Service')

// 詳細指定: ステレオタイプが "Database" のもの
.focusParticipant({ kind: 'participant', stereotype: 'Database' })
```

### Remove (要素の削除)

特定の要素を明示的に削除します。`Focus` とは異なり、指定したものだけをピンポイントで消します。

#### `.removeParticipant(selector)`

*   **Action**: `remove`
*   **Target**: `ParticipantSelector`

```typescript
// Loggerを削除
.removeParticipant('Logger')
```

#### `.removeMessage(selector)`

*   **Action**: `remove`
*   **Target**: `MessageSelector`

```typescript
// "Health Check" というメッセージを削除
.removeMessage('Health Check')

// APIからDBへのメッセージのみを削除
.removeMessage({ kind: 'message', from: 'API', to: 'DB' })
```

#### `.removeGroup(selector)`

*   **Action**: `remove`
*   **Target**: `GroupSelector`

```typescript
// "Deprecated" という名前のボックスを削除 (中身のParticipantは残る)
.removeGroup('Deprecated')
```

### Lens (レイヤーセット)

#### `.applyLens(lens)`

事前に定義された **Lens** (Layerの集合) を適用します。

```typescript
import { Lens } from '@polagraph/core';

const debugLens: Lens = {
    name: 'Debug View',
    layers: [
        { action: 'resolve', selector: { kind: 'fragment', condition: 'Error' } },
        { action: 'focus', selector: { kind: 'participant', name: 'API' } },
        { action: 'remove', selector: { kind: 'group', name: 'Deprecated' } }
    ]
};

Polagraph.init(code).applyLens(debugLens).toMermaid();
```

---

## 4. セレクター仕様 (Selectors)

ビルダーメソッドの引数 `selector` は、**簡易指定 (Simple Match)** または **詳細オブジェクト** で指定します。
詳細オブジェクトを使用する場合、`kind` プロパティは必須です（`PolagraphBuilder`経由の一部メソッドでは省略可能な場合もありますが、型定義上は指定を推奨）。

### 共通: `TextMatcher`
文字列プロパティには以下が使用可能です。
*   `string`: 部分一致 (Contains)
*   `RegExp`: 正規表現マッチ (JavaScript `RegExp`)
*   `{ pattern: string, flags?: string }`: JSON用シリアライズ形式
*   **(Note)**: メソッドの第一引数に `TextMatcher` 型を直接渡す場合、各 Selector の特定のプロパティ（`name` や `text`）にマッチします。

### A. ParticipantSelector
*   **Kind**: `'participant'`
*   **Used In**: `focusParticipant`, `removeParticipant`

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `name` | `TextMatcher` | 表示名（Label）へのマッチ (※簡易指定対象) |
| `id` | `TextMatcher` | 内部IDへのマッチ |
| `stereotype` | `TextMatcher` | ステレオタイプ (例: `<<Service>>`) |

### B. FragmentSelector
*   **Kind**: `'fragment'`
*   **Used In**: `resolveFragment`

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `condition` | `TextMatcher` | 分岐条件テキスト (例: `x > 10`) (※簡易指定対象) |
| `operator` | `string` \| `string[]` | 分岐の種類 (`alt`, `loop`, `opt`, `par` 等) |

### C. MessageSelector
*   **Kind**: `'message'`
*   **Used In**: `removeMessage`

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `text` | `TextMatcher` | メッセージ本文 (※簡易指定対象) |
| `from` | `TextMatcher` | 送信元 Participant ID/Name |
| `to` | `TextMatcher` | 受信先 Participant ID/Name |

### D. GroupSelector
*   **Kind**: `'group'`
*   **Used In**: `removeGroup`

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `name` | `TextMatcher` | グループ名（`box` や `loop` のラベル等） (※簡易指定対象) |

---

## 5. 型定義リファレンス

詳細は `packages/core/src/transformer/types.ts` を参照してください。

```typescript
export interface Lens {
    name?: string;
    description?: string;
    layers: Layer[];
}

export type Layer = ResolveLayer | FocusLayer | RemoveLayer;

export interface ResolveLayer {
    action: 'resolve';
    selector: FragmentSelector;
}

export interface FocusLayer {
    action: 'focus';
    selector: ParticipantSelector;
}

export interface RemoveLayer {
    action: 'remove';
    selector: ParticipantSelector | MessageSelector | GroupSelector;
}
```
