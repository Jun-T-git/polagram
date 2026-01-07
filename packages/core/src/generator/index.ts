import type { PolagramRoot } from '../ast';
import { MermaidGeneratorVisitor } from './generators/mermaid';
import { PlantUMLGeneratorVisitor } from './generators/plantuml';
import type { PolagramVisitor } from './interface';

/**
 * Generator interface that all generators must implement.
 */
export interface DiagramGenerator {
  generate(ast: PolagramRoot): string;
}

type GeneratorConstructor = () => PolagramVisitor & DiagramGenerator;

const generators = new Map<string, GeneratorConstructor>();

// Register built-in generators
generators.set('mermaid', () => new MermaidGeneratorVisitor());
generators.set('plantuml', () => new PlantUMLGeneratorVisitor());

/**
 * Generator Factory
 * Centralizes retrieval of generator strategies.
 * Mirrors the ParserFactory pattern for consistency.
 * 
 * @example
 * ```typescript
 * const generator = GeneratorFactory.getGenerator('mermaid');
 * const code = generator.generate(ast);
 * ```
 */
export const GeneratorFactory = {
  /**
   * Register a custom generator.
   * @param language - Language identifier (e.g., 'mermaid', 'plantuml')
   * @param factory - Factory function that creates a generator instance
   */
  register(language: string, factory: GeneratorConstructor) {
    generators.set(language, factory);
  },

  /**
   * Get a generator for the specified language.
   * @param language - Language identifier
   * @returns A generator instance
   * @throws Error if no generator is registered for the language
   */
  getGenerator(language: string): PolagramVisitor & DiagramGenerator {
    const factory = generators.get(language);
    if (!factory) {
      throw new Error(`Generator for language '${language}' not found.`);
    }
    return factory();
  },

  /**
   * Check if a generator is registered for the given language.
   */
  hasGenerator(language: string): boolean {
    return generators.has(language);
  },

  /**
   * Get list of registered languages.
   */
  getLanguages(): string[] {
    return Array.from(generators.keys());
  },
};

// Re-export for convenience
export { Traverser } from './base/walker';
export { MermaidGeneratorVisitor } from './generators/mermaid';
export { PlantUMLGeneratorVisitor } from './generators/plantuml';
export type { PolagramVisitor } from './interface';

