
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { PolagramConfigSchema } from '../src/config/schema.js';

// Helper to handle ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target output path
const OUTPUT_PATH = path.resolve(__dirname, '../../web/app/docs/config-schema.json');

type DocField = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: string;
  children?: DocField[]; // For objects
  items?: DocField; // For arrays
  options?: string[]; // For enums/unions
};

// Simplified schema walker
function generateDoc(schema: z.ZodTypeAny, name: string = '', isOptional: boolean = false): DocField | null {
  const def = schema._def || (schema as any).def;
  if (!def) {
    if (schema && typeof schema === 'object') {
       console.warn(`Invalid schema for field: ${name} (keys: ${Object.keys(schema)})`);
    } else {
       console.warn(`Invalid schema for field: ${name} (value: ${schema})`);
    }
    return null;
  }
  
  // Unwrap optional/nullable
  const typeName = def.typeName || def.type;
  if (
    typeName === 'ZodOptional' || 
    typeName === 'ZodNullable' ||
    typeName === 'optional' ||
    typeName === 'nullable'
  ) {
    const innerDoc = generateDoc(def.innerType, name, true);
    if (innerDoc && schema.description) {
        // Wrapper has a description, use it (and parse its @example)
        let desc = schema.description;
        let note = ''; 
        
        // Handle @example
        if (desc.includes('@example')) {
            const parts = desc.split('@example');
            desc = parts[0].trim();
            innerDoc.example = parts[1].trim();
        }

        // Handle @values
        if (desc.includes('@values')) {
            const parts = desc.split('@values');
            desc = parts[0].trim();
            const rawValues = parts[1].trim();
            try {
                const manual = rawValues.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                innerDoc.options = manual;
            } catch (e) {}
        }
        
        innerDoc.description = desc;
    }
    return innerDoc;
  }

  // Get description and remove @internal if present
  let description = schema.description;
  
  // Filter internal fields
  if (description?.includes('@internal')) {
    return null;
  }

  let example: string | undefined;
  if (description && description.includes('@example')) {
      const parts = description.split('@example');
      description = parts[0].trim();
      example = parts[1].trim();
  }

  // Parse @values tag for manual enum specification
  let manualOptions: string[] | undefined;
  if (description && description.includes('@values')) {
      const parts = description.split('@values');
      description = parts[0].trim();
      // Expecting CSV format: "val1", "val2"
      const rawValues = parts[1].trim();
      try {
          // crude parsing: split by comma, remove quotes
          manualOptions = rawValues.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      } catch (_e) {
          console.warn(`Failed to parse @values for ${name}: ${rawValues}`);
      }
  }

  // Basic types mapping
  let type = 'any';
  const children: DocField[] = [];
  let items: DocField | undefined;
  let options: string[] | undefined;

  // Zod v3 uses typeName, v4 seems to use type
  const zodType = def.typeName || def.type;

  switch (zodType) {
    case 'ZodString':
    case 'string':
      type = 'string';
      break;
    case 'ZodNumber':
    case 'number':
      type = 'number';
      break;
    case 'ZodBoolean':
    case 'boolean':
      type = 'boolean';
      break;
    case 'ZodLiteral':
    case 'literal': {
      const val = def.value !== undefined ? def.value : (def.values && def.values[0]);
      type = `"${val}"`;
      break;
    }
    case 'ZodEnum':
    case 'enum':
      type = 'enum';
      options = def.values || (def.entries ? Object.keys(def.entries) : undefined);
      break;
    case 'ZodArray':
    case 'array': {
      type = 'array';
      if (!def.type && !def.element) {
        // No element type found, just any[]
        break;
      }
      // Prefer element if it exists.
      const itemType = def.element || def.type;
      const itemDoc = generateDoc(itemType, 'item');
      if (itemDoc) {
        // If primitive array, just use type name like "string[]"
        if (['string', 'number', 'boolean'].includes(itemDoc.type)) {
          type = `${itemDoc.type}[]`;
        } else {
           // Complex array, use items
           items = itemDoc;
        }
      }
      break;
    }
    case 'ZodObject':
    case 'object': {
      type = 'object';
      const shape = def.shape ? (typeof def.shape === 'function' ? def.shape() : def.shape) : {};
      for (const key in shape) {
        const child = generateDoc(shape[key], key);
        if (child) {
          children.push(child);
        }
      }
      break;
    }
    case 'ZodUnion':
    case 'union': {
      // Simplified: just join types if simple, or show "union"
      const unionOptions = def.options;
      const types = unionOptions.map((opt: z.ZodTypeAny) => {
        const d = generateDoc(opt);
        return d ? d.type : 'unknown';
      });
      // If all are primitives/literals, join them
      if (types.every((t: string) => t.startsWith('"') || ['string', 'number', 'boolean'].includes(t))) {
          type = types.join(' | ');
      } else {
          // If complex (objects), we might want to show them as children or just "union"
          if (types.length > 0) {
              children.push(...unionOptions.map((opt: z.ZodTypeAny) => generateDoc(opt)).filter((d: any) => d));
          }
      }
      break;
    }
    case 'ZodDiscriminatedUnion':
    case 'discriminatedUnion': // Check if v4 uses this name
      type = 'union';
      // Treat options as children for documentation purposes
      for (const opt of def.options.values()) {
         const child = generateDoc(opt);
          if (child) children.push(child);
      }
      break;
    default:
      console.log(`Unknown type: ${zodType} for ${name}`);
      type = zodType?.replace('Zod', '') || 'unknown';
  }

  return {
    name,
    type,
    required: !isOptional,
    description: description || '',
    example,
    children: children.length > 0 ? children : undefined,
    items,
    options: options || manualOptions
  };
}

console.log('Generating config documentation...');

try {
  // We want to document the contents of "targets", but usually the user configures the whole object.
  // Actually, standard practice is to document the root object properties.
  const rootDoc = generateDoc(PolagramConfigSchema, 'root');
  
  if (!rootDoc) {
    throw new Error('Failed to generate root doc');
  }

  // Add metadata to warn against manual edits
  const outputData = {
      _warning: "DO NOT EDIT. This file is auto-generated by packages/core/scripts/gen-config-docs.ts",
      ...rootDoc
  };

  const jsonContent = JSON.stringify(outputData, null, 2);
  
  // Ensure directory exists
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, jsonContent);
  console.log(`Documentation generated at: ${OUTPUT_PATH}`);

} catch (error) {
  console.error('Error generating docs:', error);
  process.exit(1);
}
