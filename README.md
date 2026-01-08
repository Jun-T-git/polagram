# Polagram

> **Unraveling Logic.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Language](https://img.shields.io/badge/language-TypeScript-3178C6.svg)
![Status](https://img.shields.io/badge/status-Beta-yellow.svg)

**Official Website:** [https://polagram.org/](https://polagram.org/)

Polagram is a next-generation engine that parses sequence diagram code (like Mermaid or PlantUML) and renders it as an **"Interactive Structure (DOM)"** instead of a static image.

## 📖 Philosophy

**Liberation from "Completeness", Focus on "Context".**

Traditional sequence diagram tools focus on "fitting every branch into a single image." However, complex specifications in real-world development are often too massive for anyone to grasp the entire picture at once.

Polagram is built on the philosophy of **"Progressive Disclosure"**—revealing information gradually to match the reader's thought process.

## ✨ Features

* **Foldable Sequence:**
    * Collapse and expand `alt` (conditional) or `loop` blocks just like in a code editor.
* **Focus & Filter:**
    * **Focus**: Highlight only the processing routes relevant to a specific Actor or Participant.
    * **Remove**: Exclude unnecessary logs or noisy Participants.
    * **Merge**: Merge multiple internal microservices into a single "System" entity, hiding implementation details to generate a high-level overview.
* **DOM-based Rendering:**
    * Outputs manipulatable HTML/DOM instead of converting to SVG/PNG images, making text selection, search, and link sharing easy.

## 📦 Packages

Polagram adopts a Monorepo structure consisting of the following packages:

### Core Modules
* **[@polagram/core](./packages/core):**
    * The core library that converts Mermaid / PlantUML into **Polagram AST**.
    * Includes the **Transformation Engine**, providing advanced filtering capabilities like `focus`, `remove`, and `merge`.

### Tools & UI
* **[@polagram/cli](./packages/cli):**
    * A CLI tool leveraging the Polagram AST.
    * Automatically generates and transforms large numbers of diagrams based on rules defined in `polagram.yml`. Ideal for CI/CD pipelines.
* **@polagram/web (Beta):**
    * An interactive diagram viewer.

## 🚀 Getting Started with CLI

The easiest way to try Polagram's features is via the CLI.

### Installation

```bash
pnpm add -D @polagram/cli
```

### Usage

1. **Create `polagram.yml`**

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
            selector:
              kind: participant
              name:
                pattern: ".*Log.*"
          # Merge internal services into one 'Backend'
          - action: merge
            into:
              name: "Backend"
            selector:
              kind: participant
              name:
                pattern: "(Auth|Order|Payment)"
```

2. **Run**

```bash
pnpm polagram generate
```

## 🧩 Polagram AST Schema

Polagram treats sequence diagrams as a unique Tree structure. This enables not just rendering, but programmatic "Refactoring of Diagrams."

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

Ideas and Pull Requests are welcome. As we are currently in the Beta phase, we recommend starting a discussion in Issues first.

## 📄 License

MIT License
