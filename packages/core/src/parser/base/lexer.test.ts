
import { describe, expect, it } from 'vitest';
import { Token } from '../languages/mermaid/tokens';
import { BaseLexer } from './lexer';

// Concrete implementation for testing abstract class
class TestLexer extends BaseLexer {
    public nextToken(): Token {
        this.skipWhitespace();
        if (this.readPosition > this.input.length) { // fixed EOF logic for test, check base-lexer readChar behavior
             // BaseLexer: readPosition moves past End.
             return { type: 'EOF', literal: '', line: this.line, column: this.column, start: this.position, end: this.position };
        }
        
        const char = this.ch;
        const start = this.position;
        this.readChar();
        return {
            type: 'UNKNOWN', // Dummy type
            literal: char,
            line: this.line,
            column: this.column,
            start, 
            end: this.position 
        };
    }

    // Expose protected methods for testing
    public testReadIdentifier() { return this.readWhile(c => this.isLetter(c)); }
    public testIsDigit(c: string) { return this.isDigit(c); }
    public testIsLetter(c: string) { return this.isLetter(c); }
    public getChar() { return this.ch; }
}

describe('BaseLexer', () => {
    it('should initialize correctly', () => {
        const input = "abc";
        const lexer = new TestLexer(input);
        expect(lexer.getInput()).toBe(input);
        expect(lexer.getChar()).toBe('a');
    });

    it('should identify digits', () => {
        const lexer = new TestLexer("");
        expect(lexer.testIsDigit('1')).toBe(true);
        expect(lexer.testIsDigit('a')).toBe(false);
    });

    it('should identify letters', () => {
        const lexer = new TestLexer("");
        expect(lexer.testIsLetter('a')).toBe(true);
        expect(lexer.testIsLetter('_')).toBe(true);
        expect(lexer.testIsLetter('1')).toBe(false);
    });

    it('should read characters while predicate matches', () => {
        const lexer = new TestLexer("abc 123");
        const ident = lexer.testReadIdentifier();
        expect(ident).toBe("abc");
        expect(lexer.getChar()).toBe(" "); // Stops at space
    });
});
