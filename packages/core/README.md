# @polagram/core

`@polagram/core` is the core parsing and AST manipulation library for the Polagram project. It provides functionality to parse diagram languages (currently focusing on Mermaid Sequence Diagrams) into a generic Polagram Abstract Syntax Tree (AST).

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

- **Mermaid Parsing**: Supports standard Mermaid sequence diagram syntax.
  - Participants & Actors
  - Messages (sync, async, different arrow types)
  - Activations & Notes
  - Fragments (loop, alt, opt, etc.)
  - Grouping (box)
- **AST Definition**: A standardized AST structure for sequence diagrams.
- **Generators**: Re-generation of source code from AST (Visitor pattern).

## Development

- `npm run build`: Build the package.
- `npm run test`: Run unit tests.

## Architecture

This package uses a modular architecture with **Factory**, **Strategy**, and **Visitor** patterns.
See [docs/02-architecture.md](./docs/02-architecture.md) for details.

## License

MIT
