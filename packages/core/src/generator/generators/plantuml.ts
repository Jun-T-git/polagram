import type {
    ActivationNode,
    DividerNode,
    FragmentNode,
    MessageNode,
    NoteNode,
    Participant,
    ParticipantGroup,
    PolagramRoot,
    ReferenceNode,
    SpacerNode,
} from '../../ast';
import { Traverser } from '../base/walker';
import type { PolagramVisitor } from '../interface';

/**
 * Visitor implementation that generates PlantUML code.
 * Uses the same Traverser pattern as MermaidGeneratorVisitor for consistency.
 */
export class PlantUMLGeneratorVisitor implements PolagramVisitor {
  private lines: string[] = [];
  private traverser: Traverser;

  constructor() {
    this.traverser = new Traverser(this);
  }

  generate(root: PolagramRoot): string {
    this.lines = [];
    this.traverser.traverse(root);
    return this.lines.join('\n');
  }

  visitRoot(node: PolagramRoot): void {
    this.add('@startuml');

    if (node.meta.title) {
      this.add(`title ${node.meta.title}`);
    }

    const participantsMap = new Map(node.participants.map((p) => [p.id, p]));
    const groupedParticipantIds = new Set<string>();

    // Groups
    for (const group of node.groups) {
      this.visitGroup(group, participantsMap);
      group.participantIds.forEach((id) => {
        groupedParticipantIds.add(id);
      });
    }

    // Ungrouped Participants
    for (const participant of node.participants) {
      if (!groupedParticipantIds.has(participant.id)) {
        this.visitParticipant(participant);
      }
    }

    // Events - use Traverser for consistent dispatching
    this.traverser.dispatchEvents(node.events);

    this.add('@enduml');
  }

  visitParticipant(node: Participant): void {
    // If Name == ID, use concise format: "type ID"
    // Otherwise use explicit format: "type "Name" as ID"
    if (node.name === node.id) {
      this.add(`${node.type} ${node.id}`);
    } else {
      this.add(`${node.type} "${node.name}" as ${node.id}`);
    }
  }

  visitParticipantGroup(_node: ParticipantGroup): void {
    // Called by traverser, but we handle groups manually in visitRoot with context
    // This is a no-op since we use visitGroup with context instead
  }

  // Internal method with context for group handling
  private visitGroup(node: ParticipantGroup, context: Map<string, Participant>): void {
    const color = node.style?.backgroundColor
      ? ` ${node.style.backgroundColor}`
      : '';
    const title = node.name ? ` "${node.name}"` : '';

    this.add(`box${title}${color}`);

    for (const pid of node.participantIds) {
      const p = context.get(pid);
      if (p) {
        this.visitParticipant(p);
      }
    }

    this.add('end box');
  }

  visitMessage(node: MessageNode): void {
    const from = node.from || '[*]';
    const to = node.to || '[*]';

    let arrow = '->';
    if (node.type === 'reply') arrow = '-->';
    else if (node.type === 'async') arrow = '->>';

    this.add(`${from} ${arrow} ${to}: ${node.text}`);
  }

  visitFragment(node: FragmentNode): void {
    const op = node.operator;

    node.branches.forEach((branch, index) => {
      if (index === 0) {
        this.add(`${op} ${branch.condition || ''}`.trim());
      } else {
        this.add(`else ${branch.condition || ''}`.trim());
      }

      // Use Traverser for nested events
      this.traverser.dispatchEvents(branch.events);
    });

    this.add('end');
  }

  visitNote(node: NoteNode): void {
    const position = node.position || 'over';
    const participants = node.participantIds.join(', ');

    const positionStr =
      position === 'left' || position === 'right' ? `${position} of` : position;
    this.add(`note ${positionStr} ${participants}: ${node.text}`);
  }

  visitActivation(node: ActivationNode): void {
    this.add(`${node.action} ${node.participantId}`);
  }

  visitDivider(node: DividerNode): void {
    if (node.text) {
      this.add(`== ${node.text} ==`);
    } else {
      this.add('====');
    }
  }

  visitSpacer(_node: SpacerNode): void {
    // PlantUML spacer: ||| or ||45||
    this.add('|||');
  }

  visitReference(node: ReferenceNode): void {
    const participants = node.participantIds.join(', ');
    this.add(`ref over ${participants}: ${node.text}`);
  }

  // --- Helpers ---

  private add(line: string): void {
    this.lines.push(line);
  }
}
