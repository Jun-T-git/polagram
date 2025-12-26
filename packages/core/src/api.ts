import { PolagramRoot } from './ast';
import { MermaidGeneratorVisitor } from './generator/generators/mermaid';
import { ParserFactory } from './parser';
import { TransformationEngine } from './transformer/orchestration/engine';
import {
    BranchSelector,
    ParticipantSelector,
    TextMatcher,
    TransformRule
} from './transformer/types';

/**
 * Fluent API for Polagram transformations.
 * 
 * @example
 * const result = Polagram.init(mermaidCode)
 *   .focusParticipant('PaymentService')
 *   .hideParticipant('DebugLogger')
 *   .toMermaid();
 */
export class Polagram {
    /**
     * Initialize a new Polagram transformation pipeline.
     * @param code Source diagram code
     * @param format Input format (currently only 'mermaid' is supported)
     */
    static init(code: string, format: 'mermaid' = 'mermaid'): PolagramBuilder {
        const parser = ParserFactory.getParser(format);
        const ast = parser.parse(code);
        return new PolagramBuilder(ast);
    }
}

/**
 * Builder class for chaining transformations.
 */
export class PolagramBuilder {
    private ast: PolagramRoot;
    private rules: TransformRule[] = [];

    constructor(ast: PolagramRoot) {
        this.ast = ast;
    }

    // -- New Intuitive API --

    /**
     * Focus on specific participants. Keeps only interactions involving the matched participants.
     * @param selector String (partial match), RegExp, or detailed selector object with id/class
     */
    focusParticipant(selector: string | RegExp | Partial<ParticipantSelector>): this {
        this.rules.push({
            action: 'focusParticipant',
            selector: this.normalizeParticipantSelector(selector)
        });
        return this;
    }

    /**
     * Hide specific participants and their interactions.
     * @param selector String (partial match), RegExp, or detailed selector object with id/class
     */
    hideParticipant(selector: string | RegExp | Partial<ParticipantSelector>): this {
        this.rules.push({
            action: 'hideParticipant',
            selector: this.normalizeParticipantSelector(selector)
        });
        return this;
    }

    /**
     * Focus on specific fragments. Expands the fragment and shows only its content.
     * @param selector String (partial match), RegExp, or detailed selector object with id/class
     */
    focusFragment(selector: string | RegExp | Partial<BranchSelector>): this {
        this.rules.push({
            action: 'focusFragment',
            selector: this.normalizeBranchSelector(selector)
        });
        return this;
    }



    // -- Legacy API (Deprecated) -- Removed

    /**
     * Apply a custom transformation rule.
     * @param rule Custom TransformRule
     */
    transform(rule: TransformRule): this {
        this.rules.push(rule);
        return this;
    }

    /**
     * Generate Mermaid code from the transformed AST.
     */
    toMermaid(): string {
        const engine = new TransformationEngine();
        const transformedAst = engine.transform(this.ast, this.rules);
        const generator = new MermaidGeneratorVisitor();
        return generator.generate(transformedAst);
    }

    /**
     * Get the transformed AST (for advanced use cases).
     */
    toAST(): PolagramRoot {
        const engine = new TransformationEngine();
        return engine.transform(this.ast, this.rules);
    }

    // -- Helper Methods --

    private normalizeParticipantSelector(
        selector: string | RegExp | Partial<ParticipantSelector>
    ): ParticipantSelector {
        if (typeof selector === 'string' || selector instanceof RegExp) {
            return {
                kind: 'participant',
                text: selector as TextMatcher
            };
        }
        return {
            kind: 'participant',
            ...selector
        };
    }

    private normalizeBranchSelector(
        selector: string | RegExp | Partial<BranchSelector>
    ): BranchSelector {
        if (typeof selector === 'string' || selector instanceof RegExp) {
            return {
                kind: 'branch',
                text: selector as TextMatcher
            };
        }
        return {
            kind: 'branch',
            ...selector
        };
    }
}
