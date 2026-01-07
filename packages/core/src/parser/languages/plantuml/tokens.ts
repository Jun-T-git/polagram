export type TokenType =
  | 'START_UML'
  | 'END_UML'
  | 'NEWLINE'
  | 'EOF'
  | 'UNKNOWN'
  | 'IDENTIFIER'
  | 'STRING'
  | 'TITLE'
  | 'PARTICIPANT'
  | 'ACTOR'
  | 'DATABASE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'NOTE'
  | 'OF'
  | 'LEFT'
  | 'RIGHT'
  | 'OVER'
  | 'ALT'
  | 'OPT'
  | 'LOOP'
  | 'ELSE'
  | 'END'
  | 'BOX'
  | 'AS'
  | 'ARROW'
  | 'COLON'
  | 'COMMA'
  | 'DIVIDER'
  | 'BOUNDARY'
  | 'CONTROL'
  | 'ENTITY'
  | 'COLLECTIONS'
  | 'QUEUE';

export interface Token {
  type: TokenType;
  literal: string;
  line: number;
  column: number;
  start: number;
  end: number;
}
