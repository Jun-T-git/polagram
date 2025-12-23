import { Token, TokenType } from './tokens';

export class Lexer {
  private position = 0;
  private readPosition = 0;
  private ch = '';
  private line = 1;
  private column = 0;

  constructor(private input: string) {
    this.readChar();
  }

  public getInput(): string {
      return this.input;
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
        // Handling arrows vs minus
        // Arrows start with '-' and contain combinations of '-', '>', ')', 'x'
        // Examples: ->, ->>, -->, -->>, -), --), -x, --x
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
        return tok; // readString advances position
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
          // Return early because readIdentifier advances pointers
          return { type, literal, line: this.line, column: this.column - literal.length, start, end: this.position };
        } else if (this.isDigit(this.ch)) {
           // Basic support for numbers if needed (e.g. loops)
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
    // For single char tokens handled in switch, end is start + literal.length?
    // But this.readChar() is called AFTER newToken in switch cases.
    // So current position is at the char. The token consists of this char.
    // If literal is longer (like arrow), position has advanced.
    
    // Simplification: use current position?
    // Wait for single char: start is correct. End should be start + 1 (or literal.length)
    // For readString/readArrow: pointers advanced.
    
    // In switch case for single char:
    // start = this.position
    // token created.
    // readChar called.
    
    // If we use literal.length, it's safer.
    return { type: type as TokenType, literal, line: this.line, column: this.column, start, end: start + literal.length };
  }

  private readChar() {
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

  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return '';
    }
    return this.input[this.readPosition];
  }

  private skipWhitespace() {
    // Skip spaces and tabs, but NOT newlines (newlines are tokens)
    while (this.ch === ' ' || this.ch === '\t' || this.ch === '\r') {
      this.readChar();
    }
  }

  private readIdentifier(): string {
    const position = this.position;
    // Allow alphanumeric and underscore. 
    // Mermaid identifiers can be quite flexible, but let's stick to basics + numbers for now.
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
    this.readChar(); // skip opening quote
    while (this.ch !== '"' && this.ch !== '' && this.ch !== '\n') {
      this.readChar();
    }
    const str = this.input.slice(position, this.position);
    // consume closing quote if present
    if (this.ch === '"') {
      // Don't advance here, it will be done at end of nextToken logic or we should do it here?
      // Logic in nextToken calls readChar() at the end.
      // If we return from case '"', we need to ensure pointers are correct.
      // Let's rely on manual return in switch or handle carefully.
      // In switch using 'return tok', but we constructed using readString.
      // readString is called inside newToken argument evaluation.
      // So 'this.ch' is currently the closing quote.
      // The calling code does `return tok`. It does NOT call `readChar()` after switch block if we return inside.
      // Wait, my implementation of case '"' was:
      // tok = this.newToken('STRING', this.readString());
      // return tok;
      // readString stopped at '"'. So this.ch is '"'.
      // We need to consume the closing quote.
    }
    this.readChar(); // Consume the closing quote
    return str;
  }

  private isArrowStart(): boolean {
    if (this.ch !== '-') return false;
    const next = this.peekChar();
    return next === '>' || next === '-' || next === ')' || next === 'x';
  }

  private readArrow(): string {
    // Check for 4-char arrows
    const potential4 = this.input.slice(this.position, this.position + 4);
    if (
      potential4 === '-->>' || 
      potential4 === '--x'  // Wait, --x is 3 chars. 
      // The previous code had a bug or loose check? 
      // '--x' is 3 chars. '-->>' is 4.
    ) {
        // We need to be careful with exact matches.
        if (potential4 === '-->>') { this.readMulti(4); return '-->>'; }
    }

    // Check for 3-char arrows
    const potential3 = this.input.slice(this.position, this.position + 3);
    if (potential3 === '-->' || potential3 === '--)' || potential3 === '->>' || potential3 === '--x') {
       this.readMulti(3);
       return potential3;
    }

    // Check for 2-char arrows
    const potential2 = this.input.slice(this.position, this.position + 2);
    if (potential2 === '->' || potential2 === '-)' || potential2 === '-x') {
       this.readMulti(2);
       return potential2;
    }

    // Fallback to minus
    return '-';
  }
  
  private readMulti(count: number) {
    for(let i=0; i<count; i++) this.readChar();
  }

  private isLetter(ch: string): boolean {
    return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || ch === '_';
  }

  private isDigit(ch: string): boolean {
    return '0' <= ch && ch <= '9';
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
      'deactivate': 'DEACTIVATE'
    };
    return keywords[ident] || 'IDENTIFIER';
  }
}
