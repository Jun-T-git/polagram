
import type {
    ActivationNode,
    EventNode,
    FragmentNode,
    MessageNode,
    NoteNode,
    Participant,
    PolagramRoot,
    ReferenceNode,
} from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import type { MergeLayer } from '../types';

export class MergeFilter extends Walker {
  private matcher = new Matcher();
  private mergedParticipantIds = new Set<string>();
  private targetParticipantId: string = '';

  constructor(private layer: MergeLayer) {
    super();
  }

  public transform(root: PolagramRoot): PolagramRoot {
    const selector = this.layer.selector;
    const participantsToMerge: Participant[] = [];

    // 1. Identify participants to merge
    root.participants.forEach((p) => {
      if (this.matcher.matchParticipant(p, selector)) {
        participantsToMerge.push(p);
      }
    });

    if (participantsToMerge.length === 0) {
      return root;
    }

    this.mergedParticipantIds = new Set(participantsToMerge.map((p) => p.id));

    // 2. Determine Target ID and Name
    const into = this.layer.into || {};
    let targetId = into.id;
    let targetName = into.name;

    if (!targetId) {
      if (targetName) {
        // Sanitize name to create ID
        targetId = targetName.replace(/[^a-zA-Z0-9-_]/g, '_');
      } else {
        // Auto-generate from merged IDs
        targetId = participantsToMerge.map((p) => p.id).join('_');
      }
    }

    // Fallback for name if not provided
    if (!targetName) {
      // Use targetId as name if name is missing
      targetName = targetId; 
    }

    this.targetParticipantId = targetId;

    // 3. Update participants list
    // Three scenarios for Target:
    // A. Target IS one of the merged participants (e.g. merge [A, B] into A).
    //    We keep A (but possibly updated name?), B is removed.
    // B. Target exists but NOT in merged participants (e.g. merge [A, B] into C).
    //    A and B are removed. C stays where it is.
    // C. Target is NEW (e.g. merge [A, B] into New).
    //    A and B are removed. New inserted at A's position.

    const newParticipantsList: Participant[] = [];
    
    // Check if target already exists in the "remaining" set (excluding merged ones)
    const existsOutsideMerge = root.participants.some(
      (p) => p.id === targetId && !this.mergedParticipantIds.has(p.id)
    );

    // Should we add a new participant entry?
    // We add it IF it doesn't exist outside (Case B), AND we haven't added it yet.
    // If it exists outside (Case B), we just rely on the existing entry.
    
    const shouldAddNew = !existsOutsideMerge;
    let added = false; // Track if we've added the target (or if we encountered the target in merged set)

    for (const p of root.participants) {
      if (this.mergedParticipantIds.has(p.id)) {
        // This participant is being merged.
        
        // If it happens to be the target ID itself (Case A: merge [A,B] into A),
        // we essentially "keep" it (add it as the target).
        // Or if it's not the target ID, but we need to insert the *new* target here (Case C).
        
        if (shouldAddNew && !added) {
           const newParticipant: Participant = {
            id: targetId || '',
            name: targetName || '',
            type: 'participant',
             // Todo: map stereotype?
          };
          newParticipantsList.push(newParticipant);
          added = true;
        }
        // Skip p itself (it's either replaced by newParticipant, or removed)
        continue;
      }

      // Not being merged.
      // Special check: could this be the target (Case B)?
      if (p.id === targetId) {
          // This is the target, existing separately. Keep it.
          // Note: added doesn't matter here since we are keeping the existing node.
          newParticipantsList.push(p);
      } else {
          // Unrelated participant
          newParticipantsList.push(p);
      }
    }

    root.participants = newParticipantsList;

    // 4. Update Groups
    root.groups = root.groups.map((g) => {
        const newIds = new Set<string>();
        g.participantIds.forEach((pid) => {
             if (this.mergedParticipantIds.has(pid)) {
                 newIds.add(this.targetParticipantId);
             } else {
                 newIds.add(pid);
             }
        });
        return {
            ...g,
            participantIds: Array.from(newIds),
        };
    });

    // 5. Transform events
    return super.transform(root);
  }

  protected visitEvent(node: EventNode): EventNode[] {
    if (node.kind === 'message') {
      return this.transformMessage(node as MessageNode);
    }
    if (node.kind === 'note' || node.kind === 'ref') {
      return this.transformMultiParticipantNode(node as NoteNode | ReferenceNode);
    }
    if (node.kind === 'activation') {
      return this.transformActivation(node as ActivationNode);
    }

    if (node.kind === 'fragment') {
      const result = super.visitEvent(node);
      if (result.length > 0 && result[0].kind === 'fragment') {
        const fragment = result[0] as FragmentNode;
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
      from = this.targetParticipantId;
    }
    if (to && this.mergedParticipantIds.has(to)) {
      to = this.targetParticipantId;
    }

    // Check for self-message on the new participant
    if (from === this.targetParticipantId && to === this.targetParticipantId) {
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

  private transformMultiParticipantNode(
    node: NoteNode | ReferenceNode,
  ): EventNode[] {
    const newParticipantIds = new Set<string>();
    let changed = false;

    for (const pid of node.participantIds) {
      if (this.mergedParticipantIds.has(pid)) {
        newParticipantIds.add(this.targetParticipantId);
        changed = true;
      } else {
        newParticipantIds.add(pid);
      }
    }

    if (!changed) {
      return [node];
    }

    const uniqueIds = Array.from(newParticipantIds);

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
