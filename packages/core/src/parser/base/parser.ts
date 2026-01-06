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
}
