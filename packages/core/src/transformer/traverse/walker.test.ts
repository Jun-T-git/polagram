
import { describe, expect, it } from 'vitest';
import { FragmentNode, MessageNode, PolagramRoot } from '../../ast';
import { Walker } from './walker';

class IdentityWalker extends Walker {
    // Inherits default behavior (Identity)
}

describe('Walker (Base Traversal)', () => {
    const createAst = (events: any[]): PolagramRoot => ({
        kind: 'root',
        meta: { version: '1', source: 'unknown' },
        participants: [],
        groups: [],
        events
    });

    const msg: MessageNode = { 
        kind: 'message', id: 'm1', text: 'M', from: 'A', to: 'B', 
        type: 'sync', style: { line: 'solid', head: 'arrow' } 
    };

    it('returns events as is by default', () => {
        const root = createAst([msg]);
        const result = new IdentityWalker().transform(root);
        
        expect(result.events).toHaveLength(1);
        expect((result.events[0] as MessageNode).id).toBe('m1');
    });

    it('recursively traverses fragments (Deep Identiy)', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [
                { id: 'b1', condition: 'C1', events: [msg] }
            ]
        };
        const root = createAst([fragment]);
        
        const result = new IdentityWalker().transform(root);
        
        const resFrag = result.events[0] as FragmentNode;
        expect(resFrag.branches[0].events).toHaveLength(1);
        expect((resFrag.branches[0].events[0] as MessageNode).id).toBe('m1');
    });

    it('does not mutate original AST (simple check)', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [
                { id: 'b1', condition: 'C1', events: [msg] }
            ]
        };
        const root = createAst([fragment]);
        const result = new IdentityWalker().transform(root); // Should create new ref if we were being strict about CoW, but standard map returns new array.
        
        expect(result).not.toBe(root); // Root object is new
        expect(result.events).not.toBe(root.events); // Events array is new (map)
    });
});
