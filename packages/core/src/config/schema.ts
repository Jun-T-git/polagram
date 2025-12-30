import { z } from 'zod';

// -- Text Matcher --
const TextMatcherSchema = z.union([
    z.string(),
    z.object({
        pattern: z.string(),
        flags: z.string().optional()
    })
]);

// -- Selectors --
// Explicitly requiring 'kind' for all selectors

const FragmentSelectorSchema = z.object({
    kind: z.literal('fragment'),
    condition: TextMatcherSchema.optional(),
    operator: z.union([z.string(), z.array(z.string())]).optional() 
    // Note: Operator types might need to be refined if we want strict enum validation, 
    // but string is flexible for now.
});

const ParticipantSelectorSchema = z.object({
    kind: z.literal('participant'),
    name: TextMatcherSchema.optional(),
    id: TextMatcherSchema.optional(),
    stereotype: TextMatcherSchema.optional()
});

const MessageSelectorSchema = z.object({
    kind: z.literal('message'),
    text: TextMatcherSchema.optional(),
    from: TextMatcherSchema.optional(),
    to: TextMatcherSchema.optional()
});

const GroupSelectorSchema = z.object({
    kind: z.literal('group'),
    name: TextMatcherSchema.optional()
});

const SelectorSchema = z.discriminatedUnion('kind', [
    FragmentSelectorSchema,
    ParticipantSelectorSchema,
    MessageSelectorSchema,
    GroupSelectorSchema
]);

// -- Layers --

const ActionSchema = z.enum(['focus', 'remove', 'resolve']);

const LayerSchema = z.object({
    action: ActionSchema,
    selector: SelectorSchema
});

// -- Lens --

const LensSchema = z.object({
    name: z.string(),
    suffix: z.string().optional(), // Defaults to .name in logic
    layers: z.array(LayerSchema)
});

// -- Config --

const TargetConfigSchema = z.object({
    input: z.array(z.string()),
    outputDir: z.string(),
    ignore: z.array(z.string()).optional(),
    lenses: z.array(LensSchema)
});

export const PolagraphConfigSchema = z.object({
    version: z.number(),
    targets: z.array(TargetConfigSchema)
});

export type PolagraphConfig = z.infer<typeof PolagraphConfigSchema>;
export type TargetConfig = z.infer<typeof TargetConfigSchema>;
export type LensConfig = z.infer<typeof LensSchema>;

/**
 * Validates the input object against the Polagraph Config Schema.
 * Throws a formatted error message if validation fails.
 */
export function validateConfig(input: unknown): PolagraphConfig {
    const result = PolagraphConfigSchema.safeParse(input);

    if (!result.success) {
        const errorMessages = result.error.issues.map(issue => {
            const path = issue.path.join('.');
            return `[${path}]: ${issue.message}`;
        }).join('\n');
        
        throw new Error(`Invalid Polagraph Configuration:\n${errorMessages}`);
    }

    return result.data;
}
