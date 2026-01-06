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
import type { PolagramVisitor } from '../interface';

export class PlantUMLGeneratorVisitor implements PolagramVisitor {
  generate(root: PolagramRoot): string {
    return this.visitRoot(root);
  }

  visitRoot(node: PolagramRoot): string {
    const lines: string[] = ['@startuml'];
    if (node.meta.title) {
      lines.push(`title ${node.meta.title}`);
    }

    const participantsMap = new Map(node.participants.map((p) => [p.id, p]));
    const groupedParticipantIds = new Set<string>();

    // Groups
    for (const group of node.groups) {
      lines.push(this.visitGroup(group, participantsMap));
      group.participantIds.forEach((id) => {
        groupedParticipantIds.add(id);
      });
    }

    // Ungrouped Participants
    for (const participant of node.participants) {
      if (!groupedParticipantIds.has(participant.id)) {
        lines.push(this.visitParticipant(participant));
      }
    }

    // Events
    for (const event of node.events) {
      lines.push(this.visitEvent(event));
    }

    lines.push('@enduml');
    return lines.join('\n');
  }

  visitParticipant(node: Participant): string {
    // If Name == ID, use concise format: "type ID"
    // Otherwise use explicit format: "type "Name" as ID"
    if (node.name === node.id) {
      return `${node.type} ${node.id}`;
    }
    return `${node.type} "${node.name}" as ${node.id}`;
  }

  // Adjusted signature to pass context
  visitGroup(
    node: ParticipantGroup,
    context?: Map<string, Participant>,
  ): string {
    const parts: string[] = [];
    const color = node.style?.backgroundColor
      ? ` ${node.style.backgroundColor}`
      : '';
    const title = node.name ? ` "${node.name}"` : '';

    parts.push(`box${title}${color}`);

    if (context) {
      for (const pid of node.participantIds) {
        const p = context.get(pid);
        if (p) {
          parts.push(this.visitParticipant(p));
        }
      }
    }

    parts.push('end box');
    return parts.join('\n');
  }

  visitMessage(node: MessageNode): string {
    const from = node.from || '[*]'; // Handle lost/found if needed
    const to = node.to || '[*]';

    let arrow = '->';
    if (node.type === 'reply') arrow = '-->';
    else if (node.type === 'async') arrow = '->>'; // PlantUML doesn't strictly distinguish async arrow head generally, but ->> is fine

    // style override
    if (node.style.line === 'dotted') {
      // If reply, already --> (dotted). If sync but dotted: A -[dotted]-> B ?
      // PlantUML: A ..> B
      // But --> is usually standard reply.
    }

    return `${from} ${arrow} ${to}: ${node.text}`;
  }

  visitFragment(node: FragmentNode): string {
    const lines: string[] = [];
    const op = node.operator;

    node.branches.forEach((branch, index) => {
      if (index === 0) {
        lines.push(`${op} ${branch.condition || ''}`.trim());
      } else {
        lines.push(`else ${branch.condition || ''}`.trim());
      }

      for (const event of branch.events) {
        // We need to recursively visit events (messages, nested fragments, etc.)
        // But we can't easily call visitX because we don't know the type statically here or need a centralized dispatcher that returns string.
        // But wait, visitRoot has a dispatcher. We should extract it to `visitEvent`.
        // For now, let's duplicate the relevant dispatch logic or creating a helper.
        lines.push(this.visitEvent(event));
      }
    });

    lines.push('end');
    return lines.join('\n');
  }

  // biome-ignore lint/suspicious/noExplicitAny: event type is complex union
  private visitEvent(event: any): string {
    switch (event.kind) {
      case 'message':
        return this.visitMessage(event);
      case 'fragment':
        return this.visitFragment(event);
      case 'note':
        return this.visitNote(event);
      case 'activation':
        return this.visitActivation(event);
      case 'divider':
        return this.visitDivider(event);
      case 'spacer':
        return this.visitSpacer(event);
      case 'ref':
        return this.visitReference(event);
      default:
        return '';
    }
  }
  visitNote(node: NoteNode): string {
    const position = node.position || 'over';
    const participants = node.participantIds.join(', ');

    // note left of A: Text
    // note over A, B: Text
    // For 'over', we don't say 'of' in standard examples? "note over Alice", "note over Alice, Bob"
    // But 'left of', 'right of' use 'of'.
    const positionStr =
      position === 'left' || position === 'right' ? `${position} of` : position;
    return `note ${positionStr} ${participants}: ${node.text}`;
  }
  visitActivation(node: ActivationNode): string {
    // activate A
    // deactivate A
    return `${node.action} ${node.participantId}`;
  }
  visitParticipantGroup(_node: ParticipantGroup): string {
    return '';
  }
  visitDivider(_node: DividerNode): string {
    return '';
  }
  visitSpacer(_node: SpacerNode): string {
    return '';
  }
  visitReference(_node: ReferenceNode): string {
    return '';
  }
}
