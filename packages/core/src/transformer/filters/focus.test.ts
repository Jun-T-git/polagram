
import { describe, expect, it } from 'vitest';
import { FragmentNode, MessageNode, PolagraphRoot } from '../../ast';
import { FocusLayer } from '../types';
import { FocusFilter } from './focus';

describe('FocusFilter', () => {
    const createAst = (events: any[]): PolagraphRoot => ({
        kind: 'root',
        meta: { version: '1', source: 'unknown' },
        participants: [
            { id: 'A', name: 'A', type: 'participant' },
            { id: 'B', name: 'B', type: 'participant' },
            { id: 'C', name: 'C', type: 'participant' },
            { id: 'D', name: 'D', type: 'participant' }
        ],
        groups: [],
        events
    });

    const msgAB: MessageNode = { kind: 'message', id: 'm1', text: 'A->B', from: 'A', to: 'B', type: 'sync', style: { line: 'solid', head: 'arrow' } };
    const msgBC: MessageNode = { kind: 'message', id: 'm2', text: 'B->C', from: 'B', to: 'C', type: 'sync', style: { line: 'solid', head: 'arrow' } };
    const msgCD: MessageNode = { kind: 'message', id: 'm3', text: 'C->D', from: 'C', to: 'D', type: 'sync', style: { line: 'solid', head: 'arrow' } };

    it('removes messages not related to focused participant', () => {
        const root = createAst([msgAB, msgBC, msgCD]);
        const layer: FocusLayer = {
            action: 'focus',
            selector: { kind: 'participant', name: 'A' }
        };
        // Expect: msgAB (involves A), others removed
        const result = new FocusFilter(layer).transform(root);
        
        expect(result.events).toHaveLength(1);
        expect((result.events[0] as MessageNode).id).toBe('m1');
    });

    it('removes messages even inside fragments, but keeps structure', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [
                { id: 'b1', condition: 'related', events: [msgAB] },
                { id: 'b2', condition: 'irrelevant', events: [msgCD] }
            ]
        };
        const root = createAst([fragment]);
        const layer: FocusLayer = {
            action: 'focus',
            selector: { kind: 'participant', name: 'A' }
        };

        const result = new FocusFilter(layer).transform(root);
        const resFrag = result.events[0] as FragmentNode;
        
        // b1 should keep event
        expect(resFrag.branches[0].events).toHaveLength(1);
        // b2 should have event removed, BUT branch itself remains (empty)
        expect(resFrag.branches[1].events).toHaveLength(0);
    });
});
