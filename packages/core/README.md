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

- **Action**: A primitive operation on the AST (e.g., `remove`, `focus`, `resolve`).
- **Selector**: A criteria to select nodes (e.g., `participant: { name: "Logger" }`).
- **Layer**: A combination of an Action and a Selector.
- **Lens**: A collection of Layers applied sequentially.

### Example: Creating a "Client View"

```typescript
import { Transformer, Lens, Layer } from '@polagram/core';

// 1. Define Layers
const removeLogger = new Layer('remove', {
    kind: 'participant',
    name: 'Logger' // Text or Regex
});

const resolveSuccess = new Layer('resolve', {
    kind: 'fragment',
    condition: 'Success' // Keeps only the 'Success' branch of alt/opt
});

// 2. Create a Lens
const clientViewLens = new Lens('client-view', [
    removeLogger,
    resolveSuccess
]);

// 3. Transform
const transformer = new Transformer(ast);
const newAst = transformer.apply(clientViewLens);

// 4. Generate Code
const newCode = GeneratorFactory.getGenerator('mermaid').generate(newAst);
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
