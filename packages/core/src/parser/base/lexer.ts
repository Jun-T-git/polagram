
import { Token } from '../parsers/mermaid/tokens'; // Note: Should eventually move TokenType to common if shared

export abstract class BaseLexer {
  protected position = 0;
  protected readPosition = 0;
  protected ch = '';
  protected line = 1;
  protected column = 0;

  constructor(protected input: string) {
    this.readChar();
  }

  public getInput(): string {
      return this.input;
  }

  public abstract nextToken(): Token;

  protected readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = '';
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition += 1;
    this.column += 1;

    if (this.ch === '\n') {
      this.line += 1;
      this.column = 0;
    }
  }

  protected peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return '';
    }
    return this.input[this.readPosition];
  }

  protected skipWhitespace() {
    while (this.ch === ' ' || this.ch === '\t' || this.ch === '\r') {
      this.readChar();
    }
  }

  protected readWhile(predicate: (ch: string) => boolean): string {
    const position = this.position;
    while (predicate(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  protected isLetter(ch: string): boolean {
    return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || ch === '_';
  }

  protected isDigit(ch: string): boolean {
    return '0' <= ch && ch <= '9';
  }
}
