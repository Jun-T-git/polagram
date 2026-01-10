import type {
    ActivationNode,
    EventNode,
    MessageNode,
    NoteNode,
    PolagramRoot,
    ReferenceNode,
} from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import type { FocusLayer } from '../types';

export class FocusFilter extends Walker {
  private matcher = new Matcher();
  private targetParticipantIds = new Set<string>();

  constructor(private layer: FocusLayer) {
    super();
  }

  public transform(root: PolagramRoot): PolagramRoot {
    this.resolveTargetParticipants(root);
    return super.transform(root);
  }

  private resolveTargetParticipants(root: PolagramRoot) {
    this.targetParticipantIds.clear();
    const selector = this.layer.selector;

    root.participants.forEach((p) => {
      if (this.matcher.matchParticipant(p, selector)) {
        this.targetParticipantIds.add(p.id);
      }
    });
  }

  protected visitEvent(node: EventNode): EventNode[] {
    // Only apply filtering if we have targets.
    // If targets is empty, strictly speaking we should hide everything?
    // Yes, "Focus on X" means "Show ONLY X". If X is not found, show nothing.

    if (node.kind === 'message') {
      const msg = node as MessageNode;
      if (!this.isRelatedToParticipant(msg)) {
        return []; // Drop irrelevant message
      }
    }

    if (node.kind === 'note' || node.kind === 'ref') {
      return this.filterMultiParticipantNode(node as NoteNode | ReferenceNode);
    }

    if (node.kind === 'activation') {
      const activation = node as ActivationNode;
      if (!this.targetParticipantIds.has(activation.participantId)) {
        return [];
      }
    }

    return super.visitEvent(node);
  }

  private filterMultiParticipantNode(
    node: NoteNode | ReferenceNode,
  ): EventNode[] {
    const visibleIds = node.participantIds.filter((pid) =>
      this.targetParticipantIds.has(pid),
    );

    if (visibleIds.length === 0) return [];

    return [
      {
        ...node,
        participantIds: visibleIds,
      },
    ];
  }



  // Helper to check if message involves the participant from selector
  private isRelatedToParticipant(msg: MessageNode): boolean {
    if (msg.from && this.targetParticipantIds.has(msg.from)) return true;
    if (msg.to && this.targetParticipantIds.has(msg.to)) return true;
    return false;
  }
}
