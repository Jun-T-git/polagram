import type { MessageNode } from '../../ast';

export const ARROW_MAPPING: Record<
  string,
  { type: MessageNode['type']; style: MessageNode['style'] }
> = {
  '->': { type: 'sync', style: { line: 'solid', head: 'open' } },
  '->>': { type: 'sync', style: { line: 'solid', head: 'arrow' } },
  '-->': { type: 'reply', style: { line: 'dotted', head: 'open' } },
  '-->>': { type: 'reply', style: { line: 'dotted', head: 'arrow' } },
  '-)': { type: 'async', style: { line: 'solid', head: 'async' } },
  '--)': { type: 'async', style: { line: 'dotted', head: 'async' } },
  '-x': { type: 'destroy', style: { line: 'solid', head: 'cross' } },
  '--x': { type: 'destroy', style: { line: 'dotted', head: 'cross' } },
};

export const REVERSE_ARROW_MAPPING = Object.entries(ARROW_MAPPING).reduce(
  (acc, [key, value]) => {
    // Create a unique key for the style + type combination to map back to the string
    const lookupKey = JSON.stringify({ type: value.type, style: value.style });
    acc[lookupKey] = key;
    return acc;
  },
  {} as Record<string, string>,
);

export function getArrowString(
  type: MessageNode['type'],
  style: MessageNode['style'],
): string {
  const key = JSON.stringify({ type, style });
  return REVERSE_ARROW_MAPPING[key] || '->>'; // Default fallthrough
}
