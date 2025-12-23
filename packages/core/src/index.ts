
import type { AyatoriRoot } from './ast';
import { Lexer } from './lexer';
import { Parser } from './parser';

export * from './ast';
export * from './generators/mermaid';
export * from './lexer';
export * from './parser';

/**
 * Parses Mermaid code into an Ayatori AST.
 * @param code The Mermaid code to parse (string).
 * @returns The generated AST.
 */
export function parseMermaid(code: string): AyatoriRoot {
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  return parser.parse();
}
