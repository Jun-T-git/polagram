import type {
    ActivationNode,
    EventNode,
    FragmentNode,
    MessageNode,
    NoteNode,
    Participant,
    PolagramRoot,
} from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import type { MergeLayer } from '../types';

export class MergeFilter extends Walker {
  private matcher = new Matcher();
  private mergedParticipantIds = new Set<string>();
  private newParticipantId: string;

  constructor(private layer: MergeLayer) {
    super();
    // Simple id generation for now, just use the name
    this.newParticipantId = layer.newName;
  }

  public transform(root: PolagramRoot): PolagramRoot {
    const selector = this.layer.selector;

    // 1. Identify participants to merge
    root.participants.forEach((p) => {
      if (this.matcher.matchParticipant(p, selector)) {
        this.mergedParticipantIds.add(p.id);
      }
    });

    if (this.mergedParticipantIds.size === 0) {
      return root;
    }

    // 2. Add the new merged participant if not exists
    const alreadyExists = root.participants.some(
      (p) => p.id === this.newParticipantId,
    );
    if (!alreadyExists) {
      const newParticipant: Participant = {
        id: this.newParticipantId,
        name: this.layer.newName,
        type: 'participant',
      };
      // Add to the beginning or end? standard is usually appending,
      // but if we want to preserve some order it's tricky.
      // For now, let's append it.
      root.participants.push(newParticipant);
    }

    // 3. Remove original participants
    root.participants = root.participants.filter(
      (p) => !this.mergedParticipantIds.has(p.id),
    );

    // 4. Transform events
    return super.transform(root);
  }

  protected visitEvent(node: EventNode): EventNode[] {
    if (node.kind === 'message') {
      return this.transformMessage(node as MessageNode);
    }
    if (node.kind === 'note') {
      return this.transformNote(node as NoteNode);
    }
    if (node.kind === 'activation') {
      return this.transformActivation(node as ActivationNode);
    }
    // Fragments are handled by default recursion in visitFragment -> visitEvent
    // But we need to cleanup empty fragments after recursion.
    // Walker's visitEvent calls visitFragment for fragments.
    // We can override visitFragment if needed, or rely on the return value of super.visitEvent
    // which calls child visits.
    // However, Walker.visitEvent for fragment just returns [node] after visiting children.
    // We need to check if children are empty.

    if (node.kind === 'fragment') {
      const result = super.visitEvent(node);
      // result is EventNode[] (usually [node] with modified children)
      if (result.length > 0 && result[0].kind === 'fragment') {
        const fragment = result[0] as FragmentNode;
        // Check if all branches are empty
        const isEmpty = fragment.branches.every(
          (b) => b.events.length === 0,
        );
        if (isEmpty) {
          return [];
        }
      }
      return result;
    }

    return super.visitEvent(node);
  }

  private transformMessage(node: MessageNode): EventNode[] {
    let from = node.from;
    let to = node.to;

    // Map participants
    if (from && this.mergedParticipantIds.has(from)) {
      from = this.newParticipantId;
    }
    if (to && this.mergedParticipantIds.has(to)) {
      to = this.newParticipantId;
    }

    // Check for self-message on the new participant
    if (from === this.newParticipantId && to === this.newParticipantId) {
      return [];
    }

    return [
      {
        ...node,
        from,
        to,
      },
    ];
  }

  private transformNote(node: NoteNode): EventNode[] {
    const newParticipantIds = new Set<string>();
    let changed = false;

    for (const pid of node.participantIds) {
      if (this.mergedParticipantIds.has(pid)) {
        newParticipantIds.add(this.newParticipantId);
        changed = true;
      } else {
        newParticipantIds.add(pid);
      }
    }

    if (!changed) {
      return [node];
    }

    const uniqueIds = Array.from(newParticipantIds);

    // If the note is ONLY about the new participant (meaning all original participants were merged),
    // and it was originally internal to the group, we remove it.
    // Wait, the rule is: "If A and B are BOTH in APIs, Note over A,B -> Delete".
    // If "Note over A", A in APIs -> "Note over APIs".
    //
    // The user said: "C. 指定したParticipant群に関するnoteは全て削除しましょう。つまり、あなたの例ではA と B が共に APIs にマージされる場合は削除です。"
    // This implies if ALL participants of the note are in the merge set.
    // If "Note over A, C" (C external) -> "Note over APIs, C" (Keep).

    const allOriginallyMerged = node.participantIds.every((pid) =>
      this.mergedParticipantIds.has(pid),
    );

    if (allOriginallyMerged) {
      return [];
    }

    return [
      {
        ...node,
        participantIds: uniqueIds,
      },
    ];
  }

  private transformActivation(node: ActivationNode): EventNode[] {
    if (this.mergedParticipantIds.has(node.participantId)) {
      return [];
    }
    return [node];
  }
}
