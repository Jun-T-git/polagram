# @polagram/core

`@polagram/core` is the core parsing and AST manipulation library for the Polagram project. It provides functionality to parse diagram languages (currently focusing on Mermaid Sequence Diagrams) into a generic Polagram Abstract Syntax Tree (AST).

**Official Website:** [https://polagram.org/](https://polagram.org/)

## Installation

```bash
npm install @polagram/core
```

## Usage

The library provides a `ParserFactory` to get the parser for a specific language.

```typescript
import { ParserFactory, PolagramRoot } from '@polagram/core';

const mermaidCode = `
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
`;

try {
  // 1. Get the parser for Mermaid
  const parser = ParserFactory.getParser('mermaid');

  // 2. Parse the code into an AST
  const ast: PolagramRoot = parser.parse(mermaidCode);

  console.log(JSON.stringify(ast, null, 2));
} catch (error) {
  console.error('Parsing failed:', error);
}
```

### Working with the AST

You can traverse the AST using the provided types:

```typescript
import { ParserFactory, MessageNode } from '@polagram/core';

// ... obtain ast as above

ast.events.forEach(event => {
  if (event.kind === 'message') {
    const msg = event as MessageNode;
    console.log(`From: ${msg.from}, To: ${msg.to}, Text: ${msg.text}`);
  }
});
```

## Features

- **Transformation Engine**: A powerful pipeline to transform diagrams based on user intent.
    - **Lenses**: Create multiple views (e.g., "Overview", "Client Focus") from a single source diagram.
    - **Layers**: Composable transformation steps (remove, focus, resolve).
- **Mermaid Parsing**: Supports standard Mermaid sequence diagram syntax.
    - Participants & Actors
    - Messages (sync, async, different arrow types)
    - Activations & Notes
    - Fragments (loop, alt, opt, etc.)
    - Grouping (box)
- **Robust AST**: A standardized Abstract Syntax Tree for sequence diagrams.
- **Generators**: Re-generate valid Mermaid code from the transformed AST.

## Diagram Transformation

Polagram's core strength is its ability to transform diagrams. You can define **Lenses** to create different perspectives of the same complex diagram.

### Concepts

- **Action**: A primitive operation on the AST.
    - `remove`: Removes matching participants (and their messages).
    - `focus`: Keeps only matching participants (removes everyone else).
    - `merge`: Combines multiple participants into a single one (hides internal details).
- **Selector**: A criteria to select nodes.
- **Layer**: A configuration object defining an action and a selector.
- **Lens**: A collection of Layers applied sequentially.

### Example: Creating a "Client View" (Remove & Resolve)

```typescript
import { TransformationEngine, Layer } from '@polagram/core';

// 1. Define Layers
const layers: Layer[] = [
  {
    action: 'remove',
    selector: { kind: 'participant', name: 'Logger' }
  },
  {
    action: 'resolve',
    selector: { kind: 'fragment', condition: 'Success' }
  }
];

// 2. Transform
const engine = new TransformationEngine();
const newAst = engine.transform(ast, layers);
```



## Development

- `pnpm build`: Build the package.
- `pnpm test`: Run unit tests.

## Architecture

This package uses a modular architecture:
- **Parser**: Lexer/Parser based architecture for robust syntax handling.
- **AST**: Strictly typed AST nodes.
- **Transformer**: Layered transformation pipeline using Visitor pattern.


## License

MIT
