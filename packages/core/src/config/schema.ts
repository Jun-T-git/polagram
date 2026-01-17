import { z } from 'zod';

// -- Text Matcher --
const TextMatcherSchema = z.union([
  z.string(),
  z.object({
    pattern: z.string().describe('Regex pattern to match.\n@example ".*\\\\.ts$"'),
    flags: z.string().optional().describe('Regex flags to modify matching behavior (e.g. "i" for case-insensitive, "m" for multiline).\n@example "i"'),
  }),
]).describe('A string or a regex pattern to match text.');

// -- Selectors --
// Explicitly requiring 'kind' for all selectors

const FragmentSelectorSchema = z.object({
  kind: z.literal('fragment').describe('The type of element to select.\n@example "fragment"'),
  condition: TextMatcherSchema.optional().describe('Filter by branch condition text (e.g. "Success").\n@example "Success"'),
  operator: z.union([
    z.enum(['alt', 'opt', 'loop', 'par', 'break', 'critical', 'rect', 'group']),
    z.array(z.enum(['alt', 'opt', 'loop', 'par', 'break', 'critical', 'rect', 'group']))
  ]).optional().describe('Filter by loop/alt type.\n@example "loop"\n@values "loop", "alt", "opt", "break", "par", "critical"'),
}).describe('Selects fragment (alt/loop/opt) blocks.');

const ParticipantSelectorSchema = z.object({
  kind: z.literal('participant').describe('The type of element to select.\n@example "participant"'),
  name: TextMatcherSchema.optional().describe('Filter by participant name (the text displayed).\n@example "UserService"'),
  id: TextMatcherSchema.optional().describe('Filter by participant ID (alias).\n@example "S1"'),
  stereotype: TextMatcherSchema.optional().describe('Filter by stereotype (e.g. <<Service>>).\n@example "<<Service>>"'),
}).describe('Selects participants in the diagram.');

const MessageSelectorSchema = z.object({
  kind: z.literal('message').describe('The type of element to select.\n@example "message"'),
  text: TextMatcherSchema.optional().describe('Filter by message content.\n@example "Login Request"'),
  from: TextMatcherSchema.optional().describe('Filter by Sender participant ID.\n@example "User"'),
  to: TextMatcherSchema.optional().describe('Filter by Receiver participant ID.\n@example "Database"'),
}).describe('Selects messages between participants.');

const GroupSelectorSchema = z.object({
  kind: z.literal('group').describe('The type of element to select.\n@example "group"'),
  name: TextMatcherSchema.optional().describe('Filter by group name.\n@example "Services"'),
}).describe('Selects groups (boxes/rectangles) of participants.');



// -- Layers --

const ResolveLayerSchema = z.object({
  action: z.literal('resolve').describe('The operation to perform.\n@example "resolve"'),
  selector: FragmentSelectorSchema.describe('Criteria for selecting fragments to resolve.'),
}).describe('Unwraps specific branches of fragments (alt, opt, loop), simplifying the diagram.');

const FocusLayerSchema = z.object({
  action: z.literal('focus').describe('The operation to perform.\n@example "focus"'),
  selector: ParticipantSelectorSchema.describe('Criteria for selecting participants to focus on.'),
}).describe('Keeps only interactions involving the selected participants, hiding everything else.');

const RemoveLayerSchema = z.object({
  action: z.literal('remove').describe('The operation to perform.\n@example "remove"'),
  selector: z.union([
    ParticipantSelectorSchema,
    MessageSelectorSchema,
    GroupSelectorSchema,
  ]).describe('Criteria for selecting elements to remove.'),
}).describe('Removes the selected elements (participants, messages, or groups) from the diagram.');

const MergeLayerSchema = z.object({
  action: z.literal('merge').describe('The operation to perform.\n@example "merge"'),
  into: z
    .object({
      name: z.string().optional().describe('The name of the new merged participant.\n@example "User System"'),
      id: z.string().optional().describe('The ID of the new merged participant.\n@example "MergedUser"'),
      stereotype: z.string().optional().describe('The stereotype of the new merged participant.\n@example "<<System>>"'),
    })
    .optional()
    .describe('Configuration for the target participant to merge into.'),
  selector: ParticipantSelectorSchema.describe('Criteria for selecting participants to merge.'),
}).describe('Merges multiple participants into a single participant.');

const LayerSchema = z.discriminatedUnion('action', [
  ResolveLayerSchema,
  FocusLayerSchema,
  RemoveLayerSchema,
  MergeLayerSchema,
]).describe('A transformation step to apply to the diagram.');

// -- Lens --

const LensSchema = z.object({
  name: z.string().describe('Unique name for the lens. Used to generate the output filename.\n@example "web-view"'),
  suffix: z.string().optional().describe('Custom file suffix. If omitted, defaults to ".<name>".\n@example ".web.mmd"'), 
  layers: z.array(LayerSchema).describe('Ordered list of transformation layers. Applied sequentially.'),
}).describe('A specific view or transformation configuration for the diagram.');

// -- Format --

const DiagramFormatSchema = z.enum(['mermaid', 'plantuml']).describe('Supported diagram format for parsing/generation.\n@example "mermaid"');

// -- Config --

const TargetConfigSchema = z.object({
  input: z.array(z.string()).describe('Array of file paths or glob patterns to include.\n@example ["src/**/*.mmd"]'),
  outputDir: z.string().describe('Directory where generated files will be saved.\n@example "generated"'),
  ignore: z.array(z.string()).optional().describe('Array of glob patterns to exclude files from processing.\n@example ["**/node_modules/**", "**/*.test.mmd"]'),
  lenses: z.array(LensSchema).describe('List of lenses (transformations) to apply to the input diagrams.'),
  format: DiagramFormatSchema.optional().describe('Input format (auto-detected if omitted).'), 
  outputFormat: DiagramFormatSchema.optional().describe('Output format (same as input if omitted).'), 
}).describe('Defines a conversion target: inputs, output location, and transformations.');

export const PolagramConfigSchema = z.object({
  version: z.number().describe('The version of the configuration schema. Currently, only version 1 is supported.\n@example 1'),
  targets: z.array(TargetConfigSchema).describe('A list of conversion targets.'),
}).describe('The root configuration object for Polagram.');

export type PolagramConfig = z.infer<typeof PolagramConfigSchema>;
export type TargetConfig = z.infer<typeof TargetConfigSchema>;
export type LensConfig = z.infer<typeof LensSchema>;

/**
 * Validates the input object against the Polagram Config Schema.
 * Throws a formatted error message if validation fails.
 */
export function validateConfig(input: unknown): PolagramConfig {
  const result = PolagramConfigSchema.safeParse(input);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `[${path}]: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Invalid Polagram Configuration:\n${errorMessages}`);
  }

  return result.data;
}
