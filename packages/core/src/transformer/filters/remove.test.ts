
import { describe, expect, it } from 'vitest';
import { MessageNode, PolagramRoot } from '../../ast';
import { TransformRule } from '../types';
import { RemoveFilter } from './remove';

describe('RemoveFilter', () => {
    const createAst = (events: any[]): PolagramRoot => ({
        kind: 'root',
        meta: { version: '1', source: 'unknown' },
        participants: [],
        groups: [],
        events
    });

    const msgA: MessageNode = { kind: 'message', id: 'm1', text: 'Hello', from: 'A', to: 'B', type: 'sync', style: { line: 'solid', head: 'arrow' } };
    const msgB: MessageNode = { kind: 'message', id: 'm2', text: 'World', from: 'B', to: 'C', type: 'sync', style: { line: 'solid', head: 'arrow' } };

    it('removes message by direct selector', () => {
        const root = createAst([msgA, msgB]);
        const rule: TransformRule = {
            action: 'remove',
            selector: { kind: 'message', text: 'Hello' }
        };
        const result = new RemoveFilter(rule).transform(root);
        
        expect(result.events).toHaveLength(1);
        expect((result.events[0] as MessageNode).text).toBe('World');
    });

    it('removes messages related to removed participant', () => {
        const root = createAst([msgA, msgB]);
        // Remove 'C'. msgB involves C (to: C).
        const rule: TransformRule = {
            action: 'remove',
            selector: { kind: 'participant', text: 'C' }
        };
        const result = new RemoveFilter(rule).transform(root);
        
        expect(result.events).toHaveLength(1);
        expect((result.events[0] as MessageNode).id).toBe('m1');
    });
});
