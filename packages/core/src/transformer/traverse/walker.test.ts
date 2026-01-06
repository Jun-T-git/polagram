import { describe, expect, it } from 'vitest';
import type { FragmentNode, MessageNode, PolagramRoot } from '../../ast';
import { Walker } from './walker';

class IdentityWalker extends Walker {
  // Inherits default behavior (Identity)
}

class FilteringWalker extends Walker {
  // Removes messages starting with 'DROP'
  protected visitEvent(node: any): any[] {
    if (node.kind === 'message' && node.text.startsWith('DROP')) {
      return [];
    }
    return super.visitEvent(node);
  }
}

class MutatingWalker extends Walker {
  // Uppercases message text
  protected visitEvent(node: any): any[] {
    if (node.kind === 'message') {
      return [{ ...node, text: node.text.toUpperCase() }];
    }
    return super.visitEvent(node);
  }
}

class ExpandingWalker extends Walker {
  // Duplicates messages
  protected visitEvent(node: any): any[] {
    if (node.kind === 'message') {
      return [
        node,
        { ...node, id: `${node.id}_copy`, text: `${node.text} (Copy)` },
      ];
    }
    return super.visitEvent(node);
  }
}

describe('Walker (Base Traversal)', () => {
  const createAst = (events: any[]): PolagramRoot => ({
    kind: 'root',
    meta: { version: '1', source: 'unknown' },
    participants: [],
    groups: [],
    events,
  });

  const msg: MessageNode = {
    kind: 'message',
    id: 'm1',
    text: 'hello',
    from: 'A',
    to: 'B',
    type: 'sync',
    style: { line: 'solid', head: 'arrow' },
  };

  it('returns events as is by default', () => {
    const root = createAst([msg]);
    const result = new IdentityWalker().transform(root);

    expect(result.events).toHaveLength(1);
    expect((result.events[0] as MessageNode).id).toBe('m1');
  });

  it('recursively traverses fragments (Deep Identity)', () => {
    const fragment: FragmentNode = {
      kind: 'fragment',
      id: 'f1',
      operator: 'alt',
      branches: [{ id: 'b1', condition: 'C1', events: [msg] }],
    };
    const root = createAst([fragment]);

    const result = new IdentityWalker().transform(root);

    const resFrag = result.events[0] as FragmentNode;
    expect(resFrag.branches[0].events).toHaveLength(1);
    expect((resFrag.branches[0].events[0] as MessageNode).id).toBe('m1');
  });

  it('does not mutate original AST', () => {
    const fragment: FragmentNode = {
      kind: 'fragment',
      id: 'f1',
      operator: 'alt',
      branches: [{ id: 'b1', condition: 'C1', events: [msg] }],
    };
    const root = createAst([fragment]);
    const result = new IdentityWalker().transform(root);

    expect(result).not.toBe(root); // Root object is new
    expect(result.events).not.toBe(root.events); // Events array is new (map)
  });

  describe('Subclass Behaviors', () => {
    it('supports filtering (removing nodes)', () => {
      const dropMsg = { ...msg, id: 'm2', text: 'DROP me' };
      const root = createAst([msg, dropMsg]);

      const result = new FilteringWalker().transform(root);
      expect(result.events).toHaveLength(1);
      expect((result.events[0] as MessageNode).id).toBe('m1');
    });

    it('supports mutation (modifying nodes)', () => {
      const root = createAst([msg]);
      const result = new MutatingWalker().transform(root);

      expect((result.events[0] as MessageNode).text).toBe('HELLO');
    });

    it('supports expansion (1->N nodes)', () => {
      const root = createAst([msg]);
      const result = new ExpandingWalker().transform(root);

      expect(result.events).toHaveLength(2);
      expect((result.events[0] as MessageNode).text).toBe('hello');
      expect((result.events[1] as MessageNode).text).toBe('hello (Copy)');
    });

    it('handles nested mutations/filtering', () => {
      const dropMsg = { ...msg, id: 'm2', text: 'DROP nested' };
      const fragment: FragmentNode = {
        kind: 'fragment',
        id: 'f1',
        operator: 'loop',
        branches: [{ id: 'b1', events: [msg, dropMsg] }],
      };
      const root = createAst([fragment]);

      // Should filter inside the fragment
      const result = new FilteringWalker().transform(root);
      const resFrag = result.events[0] as FragmentNode;

      expect(resFrag.branches[0].events).toHaveLength(1);
      expect((resFrag.branches[0].events[0] as MessageNode).text).toBe('hello');
    });
  });
});
