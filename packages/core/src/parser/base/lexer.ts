
import { Token } from '../languages/mermaid/tokens'; // Note: Should eventually move TokenType to common if shared

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
    // Support ASCII letters and underscore
    if (('a' <= ch && ch <= 'z') || ('A' <= ch && ch <= 'Z') || ch === '_') {
      return true;
    }
    
    // Support Unicode letters (including Japanese, Chinese, Korean, etc.)
    // This uses a simple check: if the character code is > 127 (non-ASCII)
    // and it's not a digit or whitespace, treat it as a letter
    const code = ch.charCodeAt(0);
    if (code > 127) {
      // Exclude Unicode digits and whitespace
      return !/[\s\d]/.test(ch);
    }
    
    return false;
  }

  protected isDigit(ch: string): boolean {
    return '0' <= ch && ch <= '9';
  }
}
