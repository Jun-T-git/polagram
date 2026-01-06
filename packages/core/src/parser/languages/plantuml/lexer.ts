import { BaseLexer } from '../../base/lexer';
import type { Token, TokenType } from './tokens';

export class Lexer extends BaseLexer<Token> {
  public nextToken(): Token {
    this.skipWhitespace();

    const start = this.position;
    const startColumn = this.column;
    let tok: Token;

    switch (this.ch) {
      case '\n':
        tok = this.newToken('NEWLINE', this.ch, start, startColumn);
        break;
      case '@':
        if (this.peekString('startuml')) {
          this.readMulti(9);
          tok = this.newToken('START_UML', '@startuml', start, startColumn);
        } else if (this.peekString('enduml')) {
          this.readMulti(7);
          tok = this.newToken('END_UML', '@enduml', start, startColumn);
        } else {
          tok = this.newToken('UNKNOWN', this.ch, start, startColumn);
        }
        break;
      case ',':
        tok = this.newToken('COMMA', ',', start, startColumn);
        break;
      case '"': {
        const str = this.readString();
        return this.newToken('STRING', str, start, startColumn);
      }
      case ':':
        tok = this.newToken('COLON', ':', start, startColumn);
        break;
      case '-': {
        const arrow = this.readArrow();
        if (arrow) {
          tok = this.newToken('ARROW', arrow, start, startColumn);
        } else {
          tok = this.newToken('UNKNOWN', this.ch, start, startColumn);
        }
        break;
      }
      case '':
        tok = this.newToken('EOF', '', start, startColumn);
        break;
      default:
        if (this.isLetter(this.ch)) {
          const literal = this.readIdentifier();
          const type = this.lookupIdent(literal);
          return this.newToken(type, literal, start, startColumn);
        } else {
          tok = this.newToken('UNKNOWN', this.ch, start, startColumn);
        }
    }

    this.readChar();
    return tok;
  }

  private newToken(
    type: TokenType,
    literal: string,
    start: number,
    startColumn: number,
  ): Token {
    const end =
      this.position === start ? start + literal.length : this.position;
    return { type, literal, line: this.line, column: startColumn, start, end };
  }

  private readIdentifier(): string {
    const position = this.position;
    while (this.isLetter(this.ch) || this.isDigit(this.ch)) {
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
    this.readChar();
    return str;
  }

  private lookupIdent(ident: string): TokenType {
    const keywords: Record<string, TokenType> = {
      title: 'TITLE',
      participant: 'PARTICIPANT',
      actor: 'ACTOR',
      database: 'DATABASE',
      as: 'AS',
      activate: 'ACTIVATE',
      deactivate: 'DEACTIVATE',
      note: 'NOTE',
      left: 'LEFT',
      right: 'RIGHT',
      over: 'OVER',
      of: 'OF',
      alt: 'ALT',
      opt: 'OPT',
      loop: 'LOOP',
      else: 'ELSE',
      end: 'END',
      box: 'BOX',
      '@startuml': 'START_UML',
      '@enduml': 'END_UML',
    };
    return keywords[ident] || 'IDENTIFIER';
  }

  private readArrow(): string | null {
    // We are at '-'
    // Check for -->
    if (this.peekString('->')) {
      this.readMulti(2);
      return '-->';
    }
    // Check for ->
    if (this.peekExact('>')) {
      this.readMulti(1);
      return '->';
    }
    return null;
  }

  private peekExact(char: string): boolean {
    return this.input[this.position + 1] === char;
  }

  private peekString(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      if (this.input[this.position + 1 + i] !== str[i]) return false;
    }
    return true;
  }

  public readRestOfLine(): string {
    const start = this.position;
    while (
      this.input[this.position] !== '\n' &&
      this.input[this.position] !== '' &&
      this.position < this.input.length
    ) {
      this.readChar();
    }
    return this.input.slice(start, this.position).trim();
  }

  private readMulti(count: number) {
    for (let i = 0; i < count; i++) this.readChar();
  }
}
