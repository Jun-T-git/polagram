
import { DiagramParser } from './interface';
import { mermaidParser } from './languages/mermaid';
import { plantumlParser } from './languages/plantuml';

/**
 * Parser Factory
 * Centralizes retrieval of parser strategies.
 */
export class ParserFactory {
  private static parsers = new Map<string, DiagramParser>();

  static {
      // Register built-in parsers
      this.register('mermaid', mermaidParser);
      this.register('plantuml', plantumlParser);
  }

  static register(language: string, parser: DiagramParser) {
    this.parsers.set(language, parser);
  }

  static getParser(language: string): DiagramParser {
    const parser = this.parsers.get(language);
    if (!parser) {
        throw new Error(`Parser for language '${language}' not found.`);
    }
    return parser;
  }
}

// Re-export format detector
export { FormatDetector, type DiagramFormat } from './format-detector';
