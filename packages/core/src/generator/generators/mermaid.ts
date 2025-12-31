
import {
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
import { getArrowString } from '../../parser/languages/mermaid/constants';
import { Traverser } from '../base/walker';
import { PolagramVisitor } from '../interface';

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

    // Participants
    // Note: We iterate participants in defined order. 
    // Currently, AST does not preserve the interleaving of Box definitions and Participants,
    // so we cannot reliably reconstruct Box blocks wrapping specific ordered participants
    // without potentially reordering them. 
    // For now, we revert to simple iteration (ignoring boxes) to preserve order and existing behavior.
    for (const p of node.participants) {
        this.visitParticipant(p);
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

  visitParticipantGroup(node: ParticipantGroup): void {
    let line = `box`;
    if (node.style?.backgroundColor) {
        line += ` ${node.style.backgroundColor}`;
    }
    if (node.name) {
        line += ` ${node.name}`;
    }
    this.add(line);
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

      for (let i = 1; i < node.branches.length; i++) {
        const b = node.branches[i];
        const cond = b.condition ? ` ${b.condition}` : '';
        this.add(`else${cond}`);
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
