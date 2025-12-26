
import { describe, expect, it } from 'vitest';
import { FragmentNode, MessageNode, PolagramRoot } from '../../ast';
import { TransformRule } from '../types';
import { UnwrapFilter } from './unwrap';

describe('UnwrapFilter', () => {
    const createAst = (events: any[]): PolagramRoot => ({
        kind: 'root',
        meta: { version: '1', source: 'unknown' },
        participants: [],
        groups: [],
        events
    });

    const msg: MessageNode = { kind: 'message', id: 'm1', text: 'Inside', from: 'A', to: 'B', type: 'sync', style: { line: 'solid', head: 'arrow' } };

    it('unwraps fragment branch matching selector', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [
                { id: 'b1', condition: 'target', events: [msg] },
                { id: 'b2', condition: 'other', events: [] }
            ]
        };
        const root = createAst([fragment]);
        
        // Unwrap branches with condition 'target'
        const rule: TransformRule = {
            action: 'unwrap',
            selector: { kind: 'branch', text: 'target' }
        };

        const result = new UnwrapFilter(rule).transform(root);
        
        // Should trigger unwrap: return content of b1
        expect(result.events).toHaveLength(1);
        expect((result.events[0] as MessageNode).id).toBe('m1'); 
    });

    it('does nothing if no branch matches', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [
                { id: 'b1', condition: 'other', events: [msg] }
            ]
        };
        const root = createAst([fragment]);
        
        const rule: TransformRule = {
            action: 'unwrap',
            selector: { kind: 'branch', text: 'nomatch' }
        };

        const result = new UnwrapFilter(rule).transform(root);
        
        // Should keep fragment
        expect(result.events).toHaveLength(1);
        expect(result.events[0].kind).toBe('fragment');
    });
});
