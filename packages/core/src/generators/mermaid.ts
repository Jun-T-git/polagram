import type {
    AyatoriRoot,
    EventNode,
    FragmentNode,
    MessageNode,
    NoteNode,
} from '../ast';
import { getArrowString } from '../constants';

/**
 * Generates Mermaid Sequence Diagram code from Ayatori AST.
 */
export function generateMermaid(ast: AyatoriRoot): string {
  const lines: string[] = ['sequenceDiagram'];

  // 1. Meta / Configuration
  if (ast.meta?.title) {
    lines.push(`    title ${ast.meta.title}`);
  }

  // 2. Participants
  // Ayatori AST 'id' is used as the reference key.
  // If alias exists and differs from name, we output `participant id as name`?
  // Actually, standard Mermaid: `participant [alias] as [label]` or `participant [id]`
  // AST Spec:
  // participant Alice -> id="Alice", name="Alice"
  // participant A as Alice -> id="A", name="Alice"
  
  for (const p of ast.participants) {
    const typeKeyword = p.type === 'actor' ? 'actor' : 'participant';
    
    // Simplification: logic to determine if "as" is needed.
    // If id === name, just `participant id`
    // If id !== name, `participant id as name`
    // (Assuming 'alias' field in AST tracks the token used, but 'id' is canonical ref)
    
    // Safe quote handling for names with spaces?
    // Mermaid allows quotes: participant A as "Alice Cooper"
    const safeName = p.name.includes(' ') ? `"${p.name}"` : p.name;
    
    if (p.id === p.name) {
      lines.push(`    ${typeKeyword} ${p.id}`);
    } else {
      lines.push(`    ${typeKeyword} ${p.id} as ${safeName}`);
    }
  }

  // 3. Events
  for (const event of ast.events) {
    lines.push(...generateEvent(event, 1));
  }

  return lines.join('\n');
}

/**
 * Recursive function to generate lines for an event.
 */
function generateEvent(event: EventNode, indentLevel: number): string[] {
  const indent = '    '.repeat(indentLevel);
  const lines: string[] = [];

  switch (event.kind) {
    case 'message':
      lines.push(`${indent}${generateMessage(event)}`);
      break;

    case 'fragment':
      lines.push(...generateFragment(event, indentLevel));
      break;

    case 'note':
      lines.push(`${indent}${generateNote(event)}`);
      break;

    case 'activation':
      // action is 'activate' or 'deactivate'
      lines.push(`${indent}${event.action} ${event.participantId}`);
      break;

    case 'divider':
      // Mermaid comment as fallback for divider
      lines.push(`${indent}%% == ${event.text || ''} ==`);
      break;

    case 'spacer':
      // Mermaid delay
      lines.push(`${indent}...${event.text || ''}...`);
      break;
      
    default:
      // Unknown or unsupported nodes -> Ignore or comment
      break;
  }

  return lines;
}

function generateMessage(msg: MessageNode): string {
  // If from/to is null, map to [*]? Or simple text?
  // Mermaid usually treats lost messages as distinct syntax or endpoints.
  // For now, map null to [*] if that's the intention, or fallback to '?'
  const from = msg.from ?? '[*]'; 
  const to = msg.to ?? '[*]';

  const arrow = getArrowString(msg.type, msg.style);
  
  // Lifecycle suffixes
  let suffix = '';
  // According to AST definition: "mermaid 'User->>+System: Call' implies activateTarget"
  if (msg.lifecycle?.activateTarget) {
    suffix += '+';
  }
  if (msg.lifecycle?.deactivateSource) {
    suffix += '-';
  }

  return `${from}${arrow}${suffix}${to}: ${msg.text}`;
}



function generateFragment(frag: FragmentNode, indentLevel: number): string[] {
  const indent = '    '.repeat(indentLevel);
  const lines: string[] = [];

  if (frag.branches.length === 0) return lines;

  // First branch: "loop Check" or "alt Check"
  const first = frag.branches[0];
  const firstCondition = first.condition ? ` ${first.condition}` : '';
  lines.push(`${indent}${frag.operator}${firstCondition}`);
  
  lines.push(...flattenEvents(first.events, indentLevel + 1));

  // Subsequent branches: "else Other"
  for (let i = 1; i < frag.branches.length; i++) {
    const b = frag.branches[i];
    const cond = b.condition ? ` ${b.condition}` : '';
    lines.push(`${indent}else${cond}`);
    lines.push(...flattenEvents(b.events, indentLevel + 1));
  }

  lines.push(`${indent}end`);
  return lines;
}

function generateNote(note: NoteNode): string {
  // note [right of | left of | over] [participants]: [text]
  const pos = note.position;
  
  // note right of A
  // note over A,B
  let target = '';
  if (note.participantIds.length > 0) {
    target = note.participantIds.join(',');
    // If position is left/right, 'of' keyword is usually required in Mermaid?
    // "note right of Alice"
    // "note over Alice,Bob" (no of)
    if (pos !== 'over') {
      target = ` of ${target}`; 
    } else {
      target = ` ${target}`;
    }
  }

  return `note ${pos}${target}: ${note.text}`;
}

function flattenEvents(events: EventNode[], indentLevel: number): string[] {
  const result: string[] = [];
  for (const e of events) {
    result.push(...generateEvent(e, indentLevel));
  }
  return result;
}
