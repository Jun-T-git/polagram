// packages/core/src/ast.ts

/**
 * Polagram Abstract Syntax Tree (AST) Definitions
 *
 * Designed to be a lossless representation of Sequence Diagrams from:
 * - Mermaid
 * - PlantUML
 *
 * It captures structure, semantics (lifecycle, grouping), and necessary visual hints.
 */

// ------------------------------------------------------------------
// 1. Root Definition
// ------------------------------------------------------------------

export interface PolagramRoot {
  kind: 'root';
  meta: MetaData;
  participants: Participant[];
  groups: ParticipantGroup[]; // Support for Box/Group
  events: EventNode[];
}

export interface MetaData {
  version: string;
  source: 'mermaid' | 'plantuml' | 'unknown';
  title?: string;
  theme?: Record<string, string>; // Global theme/style configs
}

// ------------------------------------------------------------------
// 2. Participants & Grouping
// ------------------------------------------------------------------

export interface Participant {
  id: string;
  name: string; // Display name
  alias?: string; // Code alias (e.g., "A" for "Alice")
  type: ParticipantType;
  stereotype?: string; // <<Service>> etc.
  style?: StyleProps; // Specific color/style overrides
}

export type ParticipantType =
  | 'participant'
  | 'actor'
  | 'boundary'
  | 'control'
  | 'entity'
  | 'database'
  | 'collections' // PlantUML collections
  | 'queue'; // PlantUML queue

export interface ParticipantGroup {
  kind: 'group';
  id: string;
  name?: string; // Label for the box (e.g., "AWS Cloud")
  type?: string; // "box", "package", etc.
  participantIds: string[]; // Participants inside this group
  style?: StyleProps; // Background color (e.g., box "Green")
}

// ------------------------------------------------------------------
// 3. Events (The Sequence)
// ------------------------------------------------------------------

export type EventNode =
  | MessageNode
  | FragmentNode
  | NoteNode
  | DividerNode
  | ActivationNode
  | ReferenceNode
  | SpacerNode;

// --- A. Message (Communication & Lifecycle) ---

export type MessageEndpoint = string | null; // null = Found/Lost (Gate)

/**
 * Represents a directional interaction.
 * Includes standard sync/async calls, returns, and object creation/deletion.
 */
export interface MessageNode {
  kind: 'message';
  id: string;
  from: MessageEndpoint;
  to: MessageEndpoint;
  text: string;

  // Semantic Type
  // - sync: Solid line, standard call
  // - async: Open arrow, async message
  // - reply: Dotted line, return message
  // - create: "new", points to object head (Participant should be placed here)
  // - destroy: Points to object X (Participant ends here)
  type: 'sync' | 'async' | 'reply' | 'create' | 'destroy';

  style: {
    line: 'solid' | 'dotted';
    head: 'arrow' | 'async' | 'open' | 'cross'; // cross for lost messages sometimes
    color?: string;
  };

  // Lifecycle effects attached to this message (Syntactic sugar)
  // e.g., mermaid "User->>+System: Call" implies activateTarget
  lifecycle?: {
    activateTarget?: boolean;
    deactivateSource?: boolean;
  };
}

// --- B. Fragment (Structured Control Flow) ---

export interface FragmentNode {
  kind: 'fragment';
  id: string;
  operator: FragmentOperator;
  branches: FragmentBranch[];
}

export type FragmentOperator =
  | 'alt'
  | 'opt'
  | 'loop'
  | 'par'
  | 'break'
  | 'critical'
  | 'rect' // Visual grouping often used in Mermaid
  | 'group'; // Generic group in PlantUML

export interface FragmentBranch {
  id: string;
  condition?: string; // e.g., "Success", "[x > 5]"
  events: EventNode[];
}

// --- C. Note (Annotation) ---

export interface NoteNode {
  kind: 'note';
  id: string;
  text: string;
  position: 'left' | 'right' | 'over';
  participantIds: string[]; // 1 ID for left/right, 1+ for over
  style?: StyleProps;
}

// --- D. Activation (Independent Lifecycle) ---

/**
 * Independent activation/deactivation not tied to a specific message line.
 * e.g., Mermaid "activate A", PlantUML "activate A"
 */
export interface ActivationNode {
  kind: 'activation';
  participantId: string;
  action: 'activate' | 'deactivate';
  style?: StyleProps; // Specific color for the activation bar
}

// --- E. Reference (Interaction Use) ---

/**
 * Refers to another sequence diagram or a frame covering participants.
 * e.g., PlantUML "ref over A, B : Init"
 */
export interface ReferenceNode {
  kind: 'ref';
  id: string;
  text: string;
  participantIds: string[];
  link?: string; // Optional link to another file/document
}

// --- F. Visual Spacers & Dividers ---

export interface DividerNode {
  kind: 'divider';
  id: string;
  text?: string; // "== Title =="
}

export interface SpacerNode {
  kind: 'spacer';
  id: string;
  height?: number; // Pixel hint (PlantUML "|||")
  text?: string; // Delay text (Mermaid "...")
}

// ------------------------------------------------------------------
// 4. Common Types
// ------------------------------------------------------------------

export interface StyleProps {
  color?: string;
  backgroundColor?: string;
  shape?: string; // For notes (hexagon, box, etc.)
  // Expandable for other CSS-like properties
}
