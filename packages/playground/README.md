# @polagram/playground

Polagram Core の機能検証・デモ用のプレイグラウンドです。
特に **Scenario Extraction (Progressive Disclosure)** 機能の動作確認に使用します。

## ディレクトリ構成

```bash
packages/playground/
└── src/
    └── examples/
        ├── 01-parse/      # MermaidをパースしてASTを出力するデモ
        ├── 02-generate/   # Parse -> Generate のラウンドトリップデモ
        └── 03-transform/  # シナリオ抽出 (Unwrap/Focus) のデモ
```

各例題 (`examples/XX-name`) は自己完結しており、内部に `input/` ファイルを持っています。
実行結果は各ディレクトリ内の `output/` に保存されます。

## 実行方法

ルートディレクトリ、またはこのディレクトリで以下のコマンドを実行してください。

### 1. Parse Demo
Mermaidファイルを読み込み、AST (JSON) を出力します。

```bash
pnpm example:parse
# 出力先: src/examples/01-parse/output/complex.ast.json
```

### 2. Generate Demo
Mermaidファイルを読み込み、AST経由でMermaidコードを再生成（Roundtrip）します。

```bash
pnpm example:generate
# 出力先: src/examples/02-generate/output/complex.generated.mmd
```

### 3. Scenario Extraction Demo (Main)
複雑なシーケンス図から特定のシナリオを抽出するデモです。
- `Unwrap`: 成功ルートのみ抽出
- `Focus`: 特定サーバー周辺のみ抽出
- `Pipeline`: 上記の組み合わせ

```bash
pnpm example:transform
# 出力先: src/examples/03-transform/output/*.mmd
```
