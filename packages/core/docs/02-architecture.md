
# Architecture

`@polagram/core` is designed with extensibility and maintainability in mind, employing standard design patterns to decouple parsing logic, AST structure, and code generation.

## Directory Structure

The internal structure is organized by domain and responsibility:

- `src/index.ts`: Public API entry point.
- **`src/ast/`**: Defines the "Hub" - the central data structures.
    - `index.ts`: Type definitions for the Polagram AST (`PolagramRoot`, `MessageNode`, etc.).
- **`src/parser/`**: Handles Input (Parsing).
    - `index.ts`: **Factory** (`ParserFactory`) for retrieving parsers.
    - `interface.ts`: **Strategy** Interface (`DiagramParser`).
    - `base/`: Abstract base classes (`BaseLexer`, `BaseParser`) for code sharing.
    - `languages/`: Implementations for specific languages.
        - `mermaid/`: Mermaid-specific Lexer and Parser.
- **`src/visitor/`**: Handles Output and Traversal.
    - `interface.ts`: **Visitor** Interface (`PolagramVisitor`).
    - `base/`: Traversal logic (`Traverser`/Walker).
    - `generators/`: Visitor implementations for code generation.
        - `mermaid.ts`: `MermaidGeneratorVisitor`.

## Design Patterns

### 1. Parser Factory & Strategy
To support multiple input languages (Mermaid, PlantUML, etc.) uniformly, we use the **Strategy Pattern** combined with a **Factory**.

- **Strategy**: `DiagramParser` interface defines the contract (`parse(code: string): PolagramRoot`).
- **Factory**: `ParserFactory` manages registration and retrieval of these strategies.

```mermaid
classDiagram
    class ParserFactory {
        static getParser(language: string) DiagramParser
        static register(language: string, parser: DiagramParser)
    }

    class DiagramParser {
        <<interface>>
        parse(code: string) PolagramRoot
    }

    class MermaidParser {
        parse(code: string) PolagramRoot
    }

    ParserFactory ..> DiagramParser : creates
    MermaidParser ..|> DiagramParser : implements
```

### 2. Visitor Pattern
To support multiple output formats and operations (Validation, Transformation) without modifying the AST nodes, we use the **Visitor Pattern**.

- **Visitor**: `PolagramVisitor` interface defines methods for visiting each AST node type (`visitMessage`, `visitParticipant`, etc.).
- **Traverser**: The `Traverser` class handles the logic of walking the AST tree and dispatching calls to the Visitor.
- **Concrete Visitors**: `MermaidGeneratorVisitor` implements the interface to generate source code.

```mermaid
classDiagram
    class PolagramVisitor {
        <<interface>>
        visitRoot(node: PolagramRoot)
        visitMessage(node: MessageNode)
        ...
    }

    class MermaidGeneratorVisitor {
        string generate(node: PolagramRoot)
        visitRoot(node: PolagramRoot)
        visitMessage(node: MessageNode)
    }

    class Traverser {
        traverse(root: PolagramRoot)
        dispatchEvents(events: EventNode[])
    }

    MermaidGeneratorVisitor ..|> PolagramVisitor : implements
    Traverser --> PolagramVisitor : dispatched to
```

## Adding a New Language

### To Add a New Parser (Input)
1. Create a directory `src/parser/languages/<new-lang>/`.
2. Implement your Lexer (extending `BaseLexer`) and Parser (extending `BaseParser`).
3. Implement the `DiagramParser` interface export.
4. Register it in `src/parser/index.ts`.

### To Add a New Generator (Output)
1. Create a file `src/visitor/generators/<new-format>.ts`.
2. Implement `PolagramVisitor`.
3. Use `Traverser` to help walk the AST if needed.
