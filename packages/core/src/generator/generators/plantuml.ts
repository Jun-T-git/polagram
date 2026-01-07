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

    // Map participant ID to List of Groups (Ordered by definition in 'groups' array)
    const participantGroupsMap = new Map<string, ParticipantGroup[]>();
    
    // Initialize map
    for (const p of node.participants) {
        participantGroupsMap.set(p.id, []);
    }

    // Populate map. Since node.groups is ordered, we preserve that order in the lists.
    // This allows implicit nesting: earlier defined groups are "outer" if they wrap the same participants.
    for (const group of node.groups) {
      for (const pid of group.participantIds) {
        const list = participantGroupsMap.get(pid);
        if (list) {
            list.push(group);
        }
      }
    }

    // Stack of currently open groups
    const currentGroupStack: ParticipantGroup[] = [];

    for (const participant of node.participants) {
      // Get groups for this participant. 
      // If a participant is in [G1, G2], and currently stack is [G1], we just open G2.
      // If stack is [G1, G2] and next is in [G1], we close G2.
      const targetGroups = participantGroupsMap.get(participant.id) || [];

      // Calculate Common Prefix Length
      let commonPrefixLen = 0;
      const minLen = Math.min(currentGroupStack.length, targetGroups.length);
      for (let i = 0; i < minLen; i++) {
          if (currentGroupStack[i] === targetGroups[i]) {
              commonPrefixLen++;
          } else {
              break;
          }
      }

      // 1. Close groups that are no longer active (Pop from stack)
      // We pop until stack length matches commonPrefixLen
      while (currentGroupStack.length > commonPrefixLen) {
          this.add('end box');
          currentGroupStack.pop();
      }

      // 2. Open new groups (Push to stack)
      // We push from targetGroups starting at commonPrefixLen
      for (let i = commonPrefixLen; i < targetGroups.length; i++) {
          const groupToOpen = targetGroups[i];
          const color = groupToOpen.style?.backgroundColor
            ? ` ${groupToOpen.style.backgroundColor}`
            : '';
          const title = groupToOpen.name ? ` "${groupToOpen.name}"` : '';
          this.add(`box${title}${color}`);
          currentGroupStack.push(groupToOpen);
      }

      this.visitParticipant(participant);
    }

    // Close remaining groups in stack
    while (currentGroupStack.length > 0) {
      this.add('end box');
      currentGroupStack.pop();
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

    let header = '';
    if (node.participantIds.length > 0) {
      if (position === 'over') {
        header = `note over ${participants}`;
      } else {
        header = `note ${position} of ${participants}`;
      }
    } else {
      header = `note ${position}`;
    }

    this.add(header);
    // Split text by newlines and add each line indented
    node.text.split('\n').forEach((line) => {
      this.add(`    ${line}`);
    });
    this.add('end note');
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
