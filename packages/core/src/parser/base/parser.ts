import type { PolagramRoot } from '../../ast';
import type { BaseLexer } from './lexer';
import type { BaseToken } from './token';

export abstract class BaseParser<T extends BaseToken = BaseToken> {
  protected currToken!: T;
  protected peekToken!: T;

  constructor(protected lexer: BaseLexer<T>) {
    this.advance();
    this.advance();
  }

  protected advance() {
    this.currToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  public abstract parse(): PolagramRoot;

  protected curTokenIs(t: string): boolean {
    return this.currToken.type === t;
  }

  protected peekTokenIs(t: string): boolean {
    return this.peekToken.type === t;
  }

  protected expectPeek(t: string): boolean {
    if (this.peekTokenIs(t)) {
      this.advance();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Type-safe token type check for current token.
   * Use this instead of `(this.currToken.type as T) === '...'`
   */
  protected isCurrentToken(type: string): boolean {
    return this.currToken.type === type;
  }

  /**
   * Check if current token is one of the given types.
   */
  protected isCurrentTokenOneOf(types: string[]): boolean {
    return types.includes(this.currToken.type);
  }

  /**
   * Get current token type safely.
   */
  protected getCurrentTokenType(): string {
    return this.currToken.type;
  }
}
