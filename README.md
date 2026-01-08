# Polagram

> **Unraveling Logic.**
> 複雑に絡み合ったロジックを、解きほぐす。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Language](https://img.shields.io/badge/language-TypeScript-3178C6.svg)
![Status](https://img.shields.io/badge/status-Beta-yellow.svg)

**Official Website:** [https://polagram.org/](https://polagram.org/)

Polagram は、Mermaid や PlantUML などのシーケンス図コードを解析し、静的な画像ではなく **「インタラクティブな構造（DOM）」** としてレンダリングするための次世代エンジンです。

## 📖 Philosophy (哲学)

**「網羅性」からの解放と、「文脈」へのフォーカス。**

従来のシーケンス図ツールは「全ての分岐を一枚の画像に収める」ことに特化していました。しかし、実際の開発現場における複雑な仕様書は、巨大すぎて誰も全体像を把握できません。

Polagram は、**「読む人の思考に合わせて情報を段階的に開示する（Progressive Disclosure）」** という思想で作られています。

## ✨ Features (特徴)

* **Foldable Sequence (折りたためるシーケンス図):**
    * `alt`（条件分岐）や `loop`（繰り返し）ブロックを、コードエディタのように折りたたんだり展開したりできます。
* **Focus & Filter (関心の分離):**
    * **Focus**: 特定の Actor/Participant に関連する処理だけをハイライト。
    * **Remove**: 不要なログ出力やノイズとなる Participant を除外。
    * **Merge**: 複数の内部マイクロサービスを 1 つの「システム」としてマージし、詳細を隠蔽して俯瞰的な図を生成。
* **DOM-based Rendering:**
    * SVG/PNG画像への変換ではなく、操作可能な HTML/DOM として出力するため、テキスト選択や検索、リンク共有が容易です。

## 📦 Packages

Polagram はモノレポ（Monorepo）構成を採用しており、以下のパッケージで構成されています。

### 核心モジュール
* **[@polagram/core](./packages/core):**
    * Mermaid / PlantUML を **Polagram AST** に変換するコアライブラリ。
    * 変換エンジン（Transformation Engine）を含み、`focus`, `remove`, `merge` などの高度なフィルター処理を提供します。

### ツール & UI
* **[@polagram/cli](./packages/cli):**
    * Polagram AST を活用した CLI ツール。
    * `polagram.yml` で定義された変換ルールに基づき、大量の図を自動生成・変換します。CI/CD パイプラインに最適です。
* **@polagram/web (Beta):**
    * インタラクティブなダイアグラムビューア。

## 🚀 Getting Started with CLI

最も簡単に Polagram の機能を試す方法は CLI です。

### Installation

```bash
pnpm add -D @polagram/cli
```

### Usage

1. **`polagram.yml` を作成**

```yaml
version: 1
targets:
  - input: ["docs/*.mmd"]
    outputDir: "dist"
    lenses:
      - name: "overview"
        layers:
          # Detailed logs removal
          - action: remove
            selector: { kind: participant, name: { pattern: ".*Log.*" } }
          # Merge internal services into one 'Backend'
          - action: merge
            newName: "Backend"
            selector: { kind: participant, name: { pattern: "(Auth|Order|Payment)" } }
```

2. **実行**

```bash
pnpm polagram generate
```

## 🧩 Polagram AST Schema

Polagram は、シーケンス図を独自の木構造（Tree）として扱います。これにより、単なる描画だけでなく、プログラムによる「図のりファクタリング」が可能になります。

```typescript
// Example: Fragment Node (alt/loop) structure
{
  "kind": "fragment",
  "operator": "alt",
  "branches": [
    {
      "condition": "Success",
      "events": [ ... ]
    },
    {
      "condition": "Error",
      "events": [ ... ]
    }
  ]
}
```

## 🤝 Contribution

アイデアやプルリクエストは歓迎します。現在は Beta 段階のため、まずは Issue でディスカッションすることをお勧めします。

## 📄 License

MIT License
