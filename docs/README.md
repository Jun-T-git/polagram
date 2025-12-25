# Polagram

> **Unraveling Logic.**
> 複雑に絡み合ったロジックを、解きほぐす。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Language](https://img.shields.io/badge/language-TypeScript-3178C6.svg)
![Status](https://img.shields.io/badge/status-Alpha-orange.svg)

Polagram は、Mermaid や PlantUML などのシーケンス図コードを解析し、静的な画像ではなく **「インタラクティブな構造（DOM）」** としてレンダリングするための次世代エンジンです。

## 📖 Philosophy (哲学)

**「網羅性」からの解放と、「文脈」へのフォーカス。**

従来のシーケンス図ツールは「全ての分岐を一枚の画像に収める」ことに特化していました。しかし、実際の開発現場における複雑な仕様書は、巨大すぎて誰も全体像を把握できません。

Polagram は、**「読む人の思考に合わせて情報を段階的に開示する（Progressive Disclosure）」** という思想で作られています。

## ✨ Features (特徴)

* **Foldable Sequence (折りたためるシーケンス図):**
    * `alt`（条件分岐）や `loop`（繰り返し）ブロックを、コードエディタのように折りたたんだり展開したりできます。
* **Focus Context:**
    * 関心のある処理ルートだけを表示し、無関係なノードを視覚的にグレーアウトします。
* **DOM-based Rendering:**
    * SVG/PNG画像への変換ではなく、操作可能な HTML/DOM として出力するため、テキスト選択や検索、リンク共有が容易です。

## 🏗 Architecture

Polagram はモノレポ（Monorepo）構成を採用しており、以下のパッケージで構成されています。

### 📦 `@polagram/core` (Current Focus)
Mermaid 形式のテキストを受け取り、独自の **Polagram AST (Abstract Syntax Tree)** に変換するコアライブラリ。
UIフレームワークに依存しないため、CLIツールやVS Code拡張機能など、あらゆる環境で利用可能です。

### 📦 `@polagram/ui` (Planned)
Polagram AST を読み込み、React ベースでインタラクティブな図を描画する Web UI コンポーネント。

### 📦 `@polagram/cli` (Planned)
Polagram AST を読み込み、HTML/DOM として出力する CLI ツール。

### 📦 `@polagram/vscode` (Planned)
Polagram AST を読み込み、VS Code でインタラクティブな図を描画する VS Code 拡張機能。

## 🚀 Getting Started (Development)

現在は **Phase 1: `@polagram/core`** の開発フェーズです。

### Prerequisites
* Node.js (LTS recommended)
* pnpm

### Installation

```bash
# Clone the repository
git clone [https://github.com/your-username/polagram.git](https://github.com/your-username/polagram.git)
cd polagram

# Install dependencies (from root)
pnpm install
```

### Development
`packages/core` ディレクトリで開発を行います。

## 🧩 Polagram AST Schema
Polagram は、シーケンス図を以下のような木構造（Tree）として扱います。

```typescript
// Example: Fragment Node (alt/loop) structure
{
  "kind": "fragment",
  "operator": "alt",
  "branches": [
    {
      "condition": "Success",
      "events": [ ... ] // Recursive structure: Children events
    },
    {
      "condition": "Error",
      "events": [ ... ]
    }
  ]
}
```

## 🗺 Roadmap

### Phase 1: `@polagram/core` - Core Parsing Logic
* [ ] Lexer: Mermaid/PlantUML Text to Tokens
* [ ] Parser: Tokens to Polagram ASTEvent Node (sequence)
* [ ] Transformation: Stack-based structure building

### Phase 2: `@polagram/ui` - Web UI Component
* [ ] React Component for Polagram AST rendering
* [ ] Interactive Event Handling

### Phase 3: Web Viewer Application
* [ ] Web Application for viewing Polagram AST

### Phase 5: CLI Tool
* [ ] CLI Tool for parsing and rendering

### Phase 4: VS Code Extension
* [ ] VS Code Extension for Polagram

## 🤝 Contribution
アイデアやプルリクエストは歓迎します。現在は初期開発段階（Alpha）のため、まずは Issue でディスカッションすることをお勧めします。

## 📄 License
MIT License