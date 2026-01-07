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
import { getArrowString } from '../../common/mermaid/constants';
import { Traverser } from '../base/walker';
import type { PolagramVisitor } from '../interface';

/**
 * Visitor implementation that generates Mermaid code.
 */
export class MermaidGeneratorVisitor implements PolagramVisitor {
  private lines: string[] = [];
  private indentLevel = 0;
  private traverser: Traverser;

  constructor() {
    this.traverser = new Traverser(this);
  }
  visitParticipantGroup(node: ParticipantGroup): void {
    throw new Error('Method not implemented.');
  }

  public generate(ast: PolagramRoot): string {
    this.lines = [];
    this.indentLevel = 0;
    this.traverser.traverse(ast);
    return this.lines.join('\n');
  }

  visitRoot(node: PolagramRoot): void {
    this.lines.push('sequenceDiagram');
    this.indentLevel++;

    if (node.meta?.title) {
      this.add(`title ${node.meta.title}`);
    }

    // Map participant ID to List of Groups (Ordered by definition)
    const participantGroupsMap = new Map<string, ParticipantGroup[]>();
    for (const p of node.participants) {
        participantGroupsMap.set(p.id, []);
    }
    for (const group of node.groups) {
      for (const pid of group.participantIds) {
        const list = participantGroupsMap.get(pid);
        if (list) {
            list.push(group);
        }
      }
    }

    // Stack
    const currentGroupStack: ParticipantGroup[] = [];

    for (const participant of node.participants) {
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

      // 1. Close groups (Pop)
      while (currentGroupStack.length > commonPrefixLen) {
          this.indentLevel--;
          this.add('end');
          currentGroupStack.pop();
      }

      // 2. Open groups (Push)
      for (let i = commonPrefixLen; i < targetGroups.length; i++) {
          const groupToOpen = targetGroups[i];
          let line = `box`;
          if (groupToOpen.style?.backgroundColor) {
            line += ` ${groupToOpen.style.backgroundColor}`;
          }
          if (groupToOpen.name) {
            line += ` ${groupToOpen.name}`;
          }
          this.add(line);
          this.indentLevel++;
          currentGroupStack.push(groupToOpen);
      }

      this.visitParticipant(participant);
    }

    // Close remaining
    while (currentGroupStack.length > 0) {
      this.indentLevel--;
      this.add('end');
      currentGroupStack.pop();
    }

    // Events
    this.traverser.dispatchEvents(node.events);
  }

  visitParticipant(node: Participant): void {
    const typeKeyword = node.type === 'actor' ? 'actor' : 'participant';
    const safeName = node.name;

    if (node.id === node.name) {
      this.add(`${typeKeyword} ${node.id}`);
    } else {
      this.add(`${typeKeyword} ${node.id} as ${safeName}`);
    }
  }



  visitMessage(node: MessageNode): void {
    const from = node.from ?? '[*]';
    const to = node.to ?? '[*]';

    const arrow = getArrowString(node.type, node.style);

    let suffix = '';
    if (node.lifecycle?.activateTarget) {
      suffix += '+';
    }
    if (node.lifecycle?.deactivateSource) {
      suffix += '-';
    }

    this.add(`${from}${arrow}${suffix}${to}: ${node.text}`);
  }

  visitFragment(node: FragmentNode): void {
    if (node.branches.length === 0) return;

    const first = node.branches[0];
    const firstCondition = first.condition ? ` ${first.condition}` : '';
    this.add(`${node.operator}${firstCondition}`);

    this.indent(() => {
      this.traverser.dispatchEvents(first.events);
    });

    // Use 'and' for par, 'option' for critical, 'else' for others
    let branchKeyword = 'else';
    if (node.operator === 'par') {
      branchKeyword = 'and';
    } else if (node.operator === 'critical') {
      branchKeyword = 'option';
    }
    
    for (let i = 1; i < node.branches.length; i++) {
      const b = node.branches[i];
      const cond = b.condition ? ` ${b.condition}` : '';
      this.add(`${branchKeyword}${cond}`);
      this.indent(() => {
        this.traverser.dispatchEvents(b.events);
      });
    }

    this.add('end');
  }

  visitNote(node: NoteNode): void {
    const pos = node.position;
    let target = '';
    if (node.participantIds.length > 0) {
      target = node.participantIds.join(',');
      if (pos !== 'over') {
        target = ` of ${target}`;
      } else {
        target = ` ${target}`;
      }
    }

    this.add(`note ${pos}${target}: ${node.text}`);
  }

  visitActivation(node: ActivationNode): void {
    this.add(`${node.action} ${node.participantId}`);
  }

  visitDivider(node: DividerNode): void {
    this.add(`%% == ${node.text || ''} ==`);
  }

  visitSpacer(node: SpacerNode): void {
    this.add(`...${node.text || ''}...`);
  }

  visitReference(node: ReferenceNode): void {
    this.add(`%% ref: ${node.text}`);
  }

  // --- Helpers ---

  private add(line: string) {
    const spaces = '    '.repeat(this.indentLevel);
    this.lines.push(`${spaces}${line}`);
  }

  private indent(fn: () => void) {
    this.indentLevel++;
    fn();
    this.indentLevel--;
  }
}
