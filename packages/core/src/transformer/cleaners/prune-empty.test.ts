
import { describe, expect, it } from 'vitest';
import { FragmentNode, MessageNode, PolagraphRoot } from '../../ast';
import { StructureCleaner } from './prune-empty';

describe('StructureCleaner', () => {
    const createAst = (events: any[]): PolagraphRoot => ({
        kind: 'root',
        meta: { version: '1', source: 'unknown' },
        participants: [],
        groups: [],
        events
    });

    const msg: MessageNode = { 
        kind: 'message', 
        id: 'm1', 
        text: 'M', 
        from: 'A', 
        to: 'B', 
        type: 'sync',
        style: { line: 'solid', head: 'arrow' } 
    };

    it('removes fragment if it has no branches', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [] // Empty
        };
        const root = createAst([fragment, msg]);
        const result = new StructureCleaner().transform(root);

        expect(result.events).toHaveLength(1);
        expect((result.events[0] as MessageNode).id).toBe('m1');
    });

    it('removes branch if it has no events', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [
                { id: 'b1', condition: 'C1', events: [] }, // Empty
                { id: 'b2', condition: 'C2', events: [msg] } // Should keep
            ]
        };
        const root = createAst([fragment]);
        const result = new StructureCleaner().transform(root);

        const resFrag = result.events[0] as FragmentNode;
        expect(resFrag.branches).toHaveLength(1);
        expect(resFrag.branches[0].id).toBe('b2');
    });

    it('removes fragment if all branches are empty', () => {
        const fragment: FragmentNode = {
            kind: 'fragment', id: 'f1', operator: 'alt',
            branches: [
                { id: 'b1', condition: 'C1', events: [] }
            ]
        };
        const root = createAst([fragment]);
        const result = new StructureCleaner().transform(root);

        expect(result.events).toHaveLength(0);
    });

    it('recursively cleans nested fragments', () => {
        const innerFrag: FragmentNode = {
            kind: 'fragment', id: 'inner', operator: 'loop',
            branches: [ { id: 'ib', condition: 'loop', events: [] } ]
        };
        const outerFrag: FragmentNode = {
            kind: 'fragment', id: 'outer', operator: 'opt',
            branches: [ { id: 'ob', condition: 'opt', events: [innerFrag] } ]
        };

        const root = createAst([outerFrag, msg]);
        const result = new StructureCleaner().transform(root);

        expect(result.events).toHaveLength(1);
        expect((result.events[0] as MessageNode).id).toBe('m1');
    });
});
