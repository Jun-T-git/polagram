export type TokenType =
  | 'SEQUENCE_DIAGRAM'
  | 'NEWLINE'
  | 'EOF'
  | 'PARTICIPANT'
  | 'COLON'
  | 'IDENTIFIER'
  | 'STRING'
  | 'ARROW'
  | 'LOOP'
  | 'ALT'
  | 'OPT'
  | 'END'
  | 'ELSE'
  | 'UNKNOWN'
  | 'AS'
  | 'ACTOR'
  | 'TITLE'
  | 'NOTE'
  | 'LEFT'
  | 'RIGHT'
  | 'OVER'
  | 'OF'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'PLUS'
  | 'MINUS'
  | 'COMMA'
  | 'BOX'
  | 'PAR'
  | 'AND'
  | 'BREAK'
  | 'CRITICAL'
  | 'OPTION'
  | 'RECT';

export interface Token {
  type: TokenType;
  literal: string;
  line: number;
  column: number;
  start: number;
  end: number;
}
