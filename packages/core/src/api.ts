import { PolagramRoot } from './ast';
import { MermaidGeneratorVisitor } from './generator/generators/mermaid';
import { PlantUMLGeneratorVisitor } from './generator/generators/plantuml';
import { ParserFactory } from './parser';
import { TransformationEngine } from './transformer/orchestration/engine';
import {
    FragmentSelector,
    GroupSelector,
    Layer,
    Lens,
    MessageSelector,
    ParticipantSelector,
    TextMatcher
} from './transformer/types';

/**
 * Polagram Fluent API
 * 
 * Provides a high-level, chainable interface for transformations.
 * 
 * @example
 * const result = Polagram.init(mermaidCode)
 *   .focusParticipant('PaymentService')
 *   .removeParticipant('DebugLogger')
 *   .toMermaid();
 */
export class Polagram {
    private constructor() {}

    /**
     * Initialize a new Polagram transformation pipeline.
     * @param code Source diagram code
     * @param format Input format ('mermaid' or 'plantuml')
     */
    static init(code: string, format: 'mermaid' | 'plantuml' = 'mermaid'): PolagramBuilder {
        const parser = ParserFactory.getParser(format);
        const ast = parser.parse(code);
        return new PolagramBuilder(ast, format);
    }
}

/**
 * Builder class for chaining transformations.
 */
export class PolagramBuilder {
    private ast: PolagramRoot;
    private layers: Layer[] = [];
    private sourceFormat: 'mermaid' | 'plantuml';

    constructor(ast: PolagramRoot, sourceFormat: 'mermaid' | 'plantuml' = 'mermaid') {
        this.ast = ast;
        this.sourceFormat = sourceFormat;
    }

    // -- Entity Filtering --

    /**
     * Focus on specific participants. 
     * Keeps only interactions involving the matched participants.
     * @param selector Name (string/RegExp) or detailed ParticipantSelector
     */
    focusParticipant(selector: TextMatcher | Partial<ParticipantSelector>): this {
        this.layers.push({
            action: 'focus',
            selector: this.normalizeParticipantSelector(selector)
        });
        return this;
    }

    /**
     * Remove specific participants and their interactions.
     * @param selector Name (string/RegExp) or detailed ParticipantSelector
     */
    removeParticipant(selector: TextMatcher | Partial<ParticipantSelector>): this {
        this.layers.push({
            action: 'remove',
            selector: this.normalizeParticipantSelector(selector)
        });
        return this;
    }

    // -- Message Filtering --

    /**
     * Remove specific messages.
     * @param selector Message text (string/RegExp) or detailed MessageSelector
     */
    removeMessage(selector: TextMatcher | Partial<MessageSelector>): this {
        this.layers.push({
            action: 'remove',
            selector: this.normalizeMessageSelector(selector)
        });
        return this;
    }

    // -- Group Filtering --

    /**
     * Remove specific groups (visual boxes).
     * @param selector Group name (string/RegExp) or detailed GroupSelector
     */
    removeGroup(selector: TextMatcher | Partial<GroupSelector>): this {
        this.layers.push({
            action: 'remove',
            selector: this.normalizeGroupSelector(selector)
        });
        return this;
    }

    // -- Structural Resolution --

    /**
     * Resolve (unwrap) specific fragments like 'alt', 'opt', 'loop'.
     * Promotes the content of the matched branch and removes the wrapper.
     * @param selector Condition text (string/RegExp) or detailed FragmentSelector
     */
    resolveFragment(selector: TextMatcher | Partial<FragmentSelector>): this {
        this.layers.push({
            action: 'resolve',
            selector: this.normalizeFragmentSelector(selector)
        });
        return this;
    }

    /**
     * Apply a Lens (a named set of transformation layers).
     * @param lens Lens object containing layers
     */
    applyLens(lens: Lens): this {
        this.layers.push(...lens.layers);
        return this;
    }

    /**
     * Generate Mermaid code from the transformed AST.
     */
    toMermaid(): string {
        const engine = new TransformationEngine();
        const transformedAst = engine.transform(this.ast, this.layers);
        const generator = new MermaidGeneratorVisitor();
        return generator.generate(transformedAst);
    }

    /**
     * Generate PlantUML code from the transformed AST.
     */
    toPlantUML(): string {
        const engine = new TransformationEngine();
        const transformedAst = engine.transform(this.ast, this.layers);
        const generator = new PlantUMLGeneratorVisitor();
        return generator.generate(transformedAst);
    }

    /**
     * Get the transformed AST (for advanced use cases).
     */
    toAST(): PolagramRoot {
        const engine = new TransformationEngine();
        return engine.transform(this.ast, this.layers);
    }

    /**
     * Get the source format detected/specified during init.
     */
    getSourceFormat(): 'mermaid' | 'plantuml' {
        return this.sourceFormat;
    }

    // -- Helper Methods --

    private normalizeParticipantSelector(
        selector: TextMatcher | Partial<ParticipantSelector>
    ): ParticipantSelector {
        if (this.isTextMatcher(selector)) {
            return { kind: 'participant', name: selector };
        }
        return { kind: 'participant', ...selector };
    }

    private normalizeMessageSelector(
        selector: TextMatcher | Partial<MessageSelector>
    ): MessageSelector {
        if (this.isTextMatcher(selector)) {
            return { kind: 'message', text: selector };
        }
        return { kind: 'message', ...selector };
    }

    private normalizeGroupSelector(
        selector: TextMatcher | Partial<GroupSelector>
    ): GroupSelector {
        if (this.isTextMatcher(selector)) {
            return { kind: 'group', name: selector };
        }
        return { kind: 'group', ...selector };
    }

    private normalizeFragmentSelector(
        selector: TextMatcher | Partial<FragmentSelector>
    ): FragmentSelector {
        if (this.isTextMatcher(selector)) {
            return { kind: 'fragment', condition: selector };
        }
        return { kind: 'fragment', ...selector };
    }

    private isTextMatcher(val: any): val is TextMatcher {
        return typeof val === 'string' || val instanceof RegExp || (typeof val === 'object' && val !== null && 'pattern' in val && !('kind' in val));
    }
}
