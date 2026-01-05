/**
 * Base token interface that all token types should extend.
 * Represents a lexical token with position information.
 */
export interface BaseToken {
  /** Token type identifier */
  type: string;
  /** Literal string value of the token */
  literal: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (0-indexed) */
  column: number;
  /** Start position in source (0-indexed) */
  start: number;
  /** End position in source (0-indexed) */
  end: number;
}
