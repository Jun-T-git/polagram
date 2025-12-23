
import { describe, expect, it } from 'vitest';
import { AyatoriRoot } from '../../ast';
import { Token, TokenType } from '../languages/mermaid/tokens';
import { BaseLexer } from './lexer';
import { BaseParser } from './parser';

// Mocks
class MockLexer extends BaseLexer {
    private tokens: Token[];
    private index = 0;

    constructor(tokens: Token[]) {
        super("");
        this.tokens = tokens;
    }

    nextToken(): Token {
        if (this.index >= this.tokens.length) {
            return { type: 'EOF', literal: '', line: 0, column: 0, start: 0, end: 0 };
        }
        return this.tokens[this.index++];
    }
}

class TestParser extends BaseParser {
    parse(): AyatoriRoot {
        return { kind: 'root', meta: { version: '1.0.0', source: 'unknown' }, participants: [], groups: [], events: [] };
    }
    
    // Expose protected methods
    public getCurr() { return this.currToken; }
    public getPeek() { return this.peekToken; }
    public testAdvance() { this.advance(); }
    public testCurTokenIs(t: TokenType) { return this.curTokenIs(t); }
    public testPeakTokenIs(t: TokenType) { return this.peekTokenIs(t); }
    public testExpectPeek(t: TokenType) { return this.expectPeek(t); }
}

describe('BaseParser', () => {
    const tokens: Token[] = [
        { type: 'IDENTIFIER', literal: 'A', line: 1, column: 0, start: 0, end: 1 },
        { type: 'ARROW', literal: '->', line: 1, column: 1, start: 1, end: 3 },
        { type: 'IDENTIFIER', literal: 'B', line: 1, column: 3, start: 3, end: 4 },
    ];

    it('should initialize curr and peek tokens', () => {
        const lexer = new MockLexer(tokens);
        const parser = new TestParser(lexer);
        
        // Constructor called advance twice.
        // 1st advance: curr=undefined, peek=Tokens[0]
        // 2nd advance: curr=Tokens[0], peek=Tokens[1]
        
        expect(parser.getCurr().type).toBe('IDENTIFIER');
        expect(parser.getCurr().literal).toBe('A');
        
        expect(parser.getPeek().type).toBe('ARROW');
    });

    it('should advance tokens', () => {
        const lexer = new MockLexer(tokens);
        const parser = new TestParser(lexer);
        
        parser.testAdvance();
        // curr=Tokens[1] (ARROW), peek=Tokens[2] (IDENTIFIER B)
        expect(parser.getCurr().type).toBe('ARROW');
        expect(parser.getPeek().type).toBe('IDENTIFIER');
    });

    it('should check current and peek token types', () => {
        const lexer = new MockLexer(tokens);
        const parser = new TestParser(lexer);
        
        expect(parser.testCurTokenIs('IDENTIFIER')).toBe(true);
        expect(parser.testPeakTokenIs('ARROW')).toBe(true);
        expect(parser.testPeakTokenIs('EOF')).toBe(false);
    });

    it('should expect peek token and advance if match', () => {
        const lexer = new MockLexer(tokens);
        const parser = new TestParser(lexer);
        
        // Peek is ARROW. Expect ARROW should likely succeed?
        // Method signature: expectPeek(t). If peek matches, advance and return true.
        const result = parser.testExpectPeek('ARROW');
        expect(result).toBe(true);
        // After advance, curr is ARROW.
        expect(parser.getCurr().type).toBe('ARROW');
    });

    it('should expect peek token and return false if mismatch', () => {
         const lexer = new MockLexer(tokens);
         const parser = new TestParser(lexer);
         
         const result = parser.testExpectPeek('EOF'); // Peek is ARROW
         expect(result).toBe(false);
         // Should not have advanced
         expect(parser.getCurr().type).toBe('IDENTIFIER');
    });
});
