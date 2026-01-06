import type {
  EventNode,
  FragmentBranch,
  FragmentNode,
  PolagramRoot,
} from '../../ast';

/**
 * Abstract base class for tree transformations.
 * Implements the "Updating Visitor" pattern with Copy-on-Write immutability.
 *
 * Subclasses should override `visitEvent` to apply specific logic.
 */
export abstract class Walker {
  public transform(root: PolagramRoot): PolagramRoot {
    // 1. Map Events (Recursively)
    const newEvents = this.mapEvents(root.events);

    // 2. Map Groups (Recursively map contents inside groups?)
    // Actually, groups in AST are root-level definitions, but the events referencing them are in `events`.
    // However, if we filter participants, we might want to clean up groups as well.
    // For now, we only transform the main event timeline.

    return {
      ...root,
      events: newEvents,
    };
  }

  protected mapEvents(events: EventNode[]): EventNode[] {
    return events.flatMap((e) => this.visitEvent(e));
  }

  protected visitEvent(node: EventNode): EventNode[] {
    // Default Behavior: Deep Traversal (Identity)

    if (node.kind === 'fragment') {
      return this.visitFragment(node);
    }

    // Groups are tricky because they are defined in root.groups AND sometimes used as containers in other ASTs.
    // In Polagram AST, `Box` is currently represented as `Group` in `ParticipantGroup`?
    // Wait, let's check AST. `groups` is at root. `events` contains `Spacer`, `Note` etc.
    // Ah, AST definition has `groups` at root, but does it have Group as an Event?
    // Looking at parser.ts: `root.groups.push(group)` and `events` are just events.
    // The parser handles `box` by pushing a Group to root, but the events inside are just flattened
    // (or if structure dictates, they might be... wait, parser.ts just pushes events to the list).
    //
    // Re-checking ast.ts: `EventNode` does NOT include `ParticipantGroup`.
    // So 'box' scope is implicit or flat in the current AST?
    // Let's re-read AST definition.
    // `root.groups` is `ParticipantGroup[]`.
    // `EventNode` = Message | Fragment | Note ...
    // So "Groups" (Boxes) are visual overlays, not strict tree nodes in the Event list in the current AST definition?
    // Wait, parser.ts `parseGroup` calls `this.parseBlock(root, ['END'])`. It returns events.
    // It pushes the group to `root.groups` and sets `participantIds`.
    // It does NOT create a "GroupNode" in the event stream.
    //
    // CONCLUSION: The AST structure for "Box" is flat in `events`.
    // The visual grouping is determined by `root.groups` which contains `participantIds`.
    //
    // So for TreeMapper, we only need to care about recursive structures: `FragmentNode`.

    return [node];
  }

  protected visitFragment(node: FragmentNode): EventNode[] {
    // Recursively map branches
    const newBranches = node.branches.map((b) => this.visitBranch(b));

    // Return new node
    return [
      {
        ...node,
        branches: newBranches,
      },
    ];
  }

  protected visitBranch(branch: FragmentBranch): FragmentBranch {
    return {
      ...branch,
      events: this.mapEvents(branch.events),
    };
  }
}
