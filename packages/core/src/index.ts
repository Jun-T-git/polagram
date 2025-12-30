
// Public API Exports

// AST
export * from './ast';

// Parsers (Factory & Strategy)
export { ParserFactory } from './parser';
export type { DiagramParser } from './parser/interface';

// Generators
export { Traverser } from './generator/base/walker';
export type { PolagraphVisitor } from './generator/interface';

// Default Implementations (Optional, or force users to use Factory)
// We export Mermaid Generator specifically as it might be used directly or via a future Factory
export { MermaidGeneratorVisitor } from './generator/generators/mermaid';

// Transformation Engine
export * from './transformer';

// Fluent API (Recommended for most users)
export { Polagraph, PolagraphBuilder } from './api';

// Legacy compatibility or convenience helpers could go here if needed.

// Configuration & Schema
export * from './config';
