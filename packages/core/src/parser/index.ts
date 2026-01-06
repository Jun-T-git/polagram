import type { DiagramParser } from './interface';
import { mermaidParser } from './languages/mermaid';
import { plantumlParser } from './languages/plantuml';

const parsers = new Map<string, DiagramParser>();

// Register built-in parsers
parsers.set('mermaid', mermaidParser);
parsers.set('plantuml', plantumlParser);

/**
 * Parser Factory
 * Centralizes retrieval of parser strategies.
 */
export const ParserFactory = {
  register(language: string, parser: DiagramParser) {
    parsers.set(language, parser);
  },

  getParser(language: string): DiagramParser {
    const parser = parsers.get(language);
    if (!parser) {
      throw new Error(`Parser for language '${language}' not found.`);
    }
    return parser;
  },
};

// Re-export format detector
export { type DiagramFormat, FormatDetector } from './format-detector';
