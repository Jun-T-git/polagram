import { PolagramRoot } from '../../ast';
import { Token, TokenType } from '../languages/mermaid/tokens'; // Should generalize
import { BaseLexer } from './lexer';

export abstract class BaseParser {
  protected currToken!: Token;
  protected peekToken!: Token;

  constructor(protected lexer: BaseLexer) {
    this.advance();
    this.advance();
  }

  protected advance() {
    this.currToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  public abstract parse(): PolagramRoot;

  protected curTokenIs(t: TokenType): boolean {
    return this.currToken.type === t;
  }

  protected peekTokenIs(t: TokenType): boolean {
    return this.peekToken.type === t;
  }

  protected expectPeek(t: TokenType): boolean {
    if (this.peekTokenIs(t)) {
      this.advance();
      return true;
    } else {
      return false;
    }
  }
}
