
import { BaseLexer } from '../../base/lexer';
import { Token, TokenType } from './tokens';

export class Lexer extends BaseLexer {
  
  constructor(input: string) {
    super(input);
  }

  public nextToken(): Token {
    this.skipWhitespace();

    const start = this.position;
    let tok: Token;

    switch (this.ch) {
      case ':':
        tok = this.newToken('COLON', this.ch, start);
        break;
      case ',':
        tok = this.newToken('COMMA', this.ch, start);
        break;
      case '+':
        tok = this.newToken('PLUS', this.ch, start);
        break;
      case '-':
        if (this.isArrowStart()) {
          const literal = this.readArrow();
          tok = this.newToken('ARROW', literal, start);
          return tok;
        } else {
          tok = this.newToken('MINUS', this.ch, start);
        }
        break;
      case '"':
        tok = this.newToken('STRING', this.readString(), start);
        return tok; 
      case '\n':
        tok = this.newToken('NEWLINE', this.ch, start);
        break;
      case '':
        tok = this.newToken('EOF', '', start);
        break;
      default:
        if (this.isLetter(this.ch)) {
          const literal = this.readIdentifier();
          const type = this.lookupIdent(literal);
          return { type, literal, line: this.line, column: this.column - literal.length, start, end: this.position };
        } else if (this.isDigit(this.ch)) {
           const literal = this.readNumber();
           return { type: 'IDENTIFIER', literal, line: this.line, column: this.column - literal.length, start, end: this.position };
        } else {
          tok = this.newToken('UNKNOWN', this.ch, start);
        }
    }

    this.readChar();
    return tok;
  }

  private newToken(type: TokenType | 'UNKNOWN', literal: string, start: number): Token {
    return { type: type as TokenType, literal, line: this.line, column: this.column, start, end: start + literal.length };
  }

  private readIdentifier(): string {
    const position = this.position;
    while (this.isLetter(this.ch) || this.isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  private readNumber(): string {
    const position = this.position;
    while (this.isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  private readString(): string {
    const position = this.position + 1;
    this.readChar(); 
    while (this.ch !== '"' && this.ch !== '' && this.ch !== '\n') {
      this.readChar();
    }
    const str = this.input.slice(position, this.position);
    if (this.ch === '"') {
      // Logic handled in nextToken via readChar or here?
      // In BaseLexer readChar advances. 
      // Original logic was slightly tricky.
      // Let's keep consistent with valid implementation.
    }
    this.readChar(); 
    return str;
  }

  private isArrowStart(): boolean {
    if (this.ch !== '-') return false;
    const next = this.peekChar();
    return next === '>' || next === '-' || next === ')' || next === 'x';
  }

  private readArrow(): string {
    const potential4 = this.input.slice(this.position, this.position + 4);
    if (potential4 === '-->>') { this.readMulti(4); return '-->>'; }

    const potential3 = this.input.slice(this.position, this.position + 3);
    if (potential3 === '-->' || potential3 === '--)' || potential3 === '->>' || potential3 === '--x') {
       this.readMulti(3);
       return potential3;
    }

    const potential2 = this.input.slice(this.position, this.position + 2);
    if (potential2 === '->' || potential2 === '-)' || potential2 === '-x') {
       this.readMulti(2);
       return potential2;
    }

    return '-';
  }
  
  private readMulti(count: number) {
    for(let i=0; i<count; i++) this.readChar();
  }

  private lookupIdent(ident: string): TokenType {
    const keywords: Record<string, TokenType> = {
      'sequenceDiagram': 'SEQUENCE_DIAGRAM',
      'participant': 'PARTICIPANT',
      'actor': 'ACTOR',
      'loop': 'LOOP',
      'alt': 'ALT',
      'opt': 'OPT',
      'end': 'END',
      'else': 'ELSE',
      'note': 'NOTE',
      'left': 'LEFT',
      'right': 'RIGHT',
      'over': 'OVER',
      'of': 'OF',
      'as': 'AS',
      'title': 'TITLE',
      'activate': 'ACTIVATE',
      'deactivate': 'DEACTIVATE',
      'box': 'BOX'
    };
    return keywords[ident] || 'IDENTIFIER';
  }
}
