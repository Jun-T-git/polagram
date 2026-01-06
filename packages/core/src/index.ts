// Public API Exports

// Fluent API (Recommended for most users)
export { Polagram, PolagramBuilder } from './api';
// AST
export * from './ast';
// Default Implementations (Optional, or force users to use Factory)
// We export Mermaid Generator specifically as it might be used directly or via a future Factory
// Config & Validation
export * from './config/schema';
// Generators
export { Traverser } from './generator/base/walker';
export { MermaidGeneratorVisitor } from './generator/generators/mermaid';
export { PlantUMLGeneratorVisitor } from './generator/generators/plantuml';
export type { PolagramVisitor } from './generator/interface';
// Parsers (Factory & Strategy)
export { ParserFactory } from './parser';
export type { DiagramFormat } from './parser/format-detector';
export { FormatDetector } from './parser/format-detector';
export type { DiagramParser } from './parser/interface';
// Transformation Engine
export * from './transformer';

// Legacy compatibility or convenience helpers could go here if needed.

// Configuration & Schema
export * from './config';
