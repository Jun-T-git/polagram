
import { describe, expect, it } from 'vitest';
import { FragmentNode, MessageNode, PolagramRoot } from '../../ast';
import { ResolveLayer } from '../types';
import { ResolveFilter } from './resolve';

describe('ResolveFilter', () => {
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
        const layer: ResolveLayer = {
            action: 'resolve',
            selector: { kind: 'fragment', condition: 'target' }
        };

        const result = new ResolveFilter(layer).transform(root);
        
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
        
        const layer: ResolveLayer = {
            action: 'resolve',
            selector: { kind: 'fragment', condition: 'nomatch' }
        };

        const result = new ResolveFilter(layer).transform(root);
        
        // Should keep fragment
        expect(result.events).toHaveLength(1);
        expect(result.events[0].kind).toBe('fragment');
    });
});
