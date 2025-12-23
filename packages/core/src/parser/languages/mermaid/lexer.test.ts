
import { describe, expect, it } from 'vitest';
import { Lexer } from './lexer';
import { TokenType } from './tokens';

describe('Mermaid Lexer', () => {
  const checkValues = (input: string, expected: [TokenType, string][]) => {
      const lexer = new Lexer(input);
      for (const [type, literal] of expected) {
          const token = lexer.nextToken();
          expect(token.type).toBe(type);
          expect(token.literal).toBe(literal);
      }
  };

  it('should parse simple tokens', () => {
    const input = 'sequenceDiagram participant :';
    checkValues(input, [
        ['SEQUENCE_DIAGRAM', 'sequenceDiagram'],
        ['PARTICIPANT', 'participant'], 
        ['COLON', ':']
    ]);
  });
  
  it('should parse keywords correctly', () => {
      // Re-verify 'participant'
      const lexer = new Lexer('participant actor loop');
      
      const t1 = lexer.nextToken();
      expect(t1.type).toBe('PARTICIPANT');
      
      const t2 = lexer.nextToken();
      expect(t2.type).toBe('ACTOR');

      const t3 = lexer.nextToken();
      expect(t3.type).toBe('LOOP');
  });

  it('should parse arrows', () => {
      checkValues('-> --> ->> -->> -) --) -x --x', [
          ['ARROW', '->'],
          ['ARROW', '-->'],
          ['ARROW', '->>'],
          ['ARROW', '-->>'],
          ['ARROW', '-)'],
          ['ARROW', '--)'], 
                           
          // Let's debug my lexer readArrow implementation logic mentally.
          // potential3: '--)' is checked.
          // So expected is ARROW '--)'
      ]);
      
      const l2 = new Lexer('--)');
      const t = l2.nextToken();
      expect(t.type).toBe('ARROW');
      expect(t.literal).toBe('--)');
  });

  it('should parse strings', () => {
      checkValues('"hello world"', [
          ['STRING', 'hello world']
      ]);
  });

  it('should parse plus and minus', () => {
    checkValues('+ -', [
        ['PLUS', '+'],
        ['MINUS', '-']
    ]);
  });
});
