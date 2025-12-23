
import { DiagramParser } from '../../interface';
import { Lexer } from './lexer';
import { Parser } from './parser';

export const mermaidParser: DiagramParser = {
    parse: (code: string) => {
        const lexer = new Lexer(code);
        const parser = new Parser(lexer);
        return parser.parse();
    }
};

export { Lexer } from './lexer';
export { Parser } from './parser';

