import { describe, expect, it } from 'vitest';
import type { PolagramRoot } from '../../ast';
import { MergeFilter } from './merge';

describe('MergeFilter', () => {
    const createBaseAst = (): PolagramRoot => ({
        kind: 'root',
        meta: { version: '1.0', source: 'unknown' },
        participants: [
            { id: 'A', name: 'Service A', type: 'participant' },
            { id: 'B', name: 'Service B', type: 'participant' },
            { id: 'C', name: 'Service C', type: 'participant' },
        ],
        groups: [],
        events: [],
    });

    it('should merge participants into a new one with strict ID and Name', () => {
        const root = createBaseAst();
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'merged_ab', name: 'MergedAB' },
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);

        const pIds = result.participants.map(p => p.id);
        expect(pIds).not.toContain('A');
        expect(pIds).not.toContain('B');
        expect(pIds).toContain('merged_ab');
        expect(pIds).toContain('C');

        const merged = result.participants.find(p => p.id === 'merged_ab');
        expect(merged?.name).toBe('MergedAB');
    });

    it('should auto-generate ID from Name if ID is missing', () => {
        const root = createBaseAst();
        const filter = new MergeFilter({
            action: 'merge',
            into: { name: 'Merged AB' }, // ID should become 'Merged_AB' or similar
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        const merged = result.participants.find(p => p.name === 'Merged AB');
        expect(merged).toBeDefined();
        expect(merged?.id).toBe('Merged_AB'); // Verify simple sanitization
    });

    it('should auto-generate ID and Name if both are missing', () => {
        const root = createBaseAst();
        const filter = new MergeFilter({
            action: 'merge',
            into: {}, // Auto-gen
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        // Should generate ID 'A_B' (A + B joined)
        const merged = result.participants.find(p => p.id === 'A_B');
        expect(merged).toBeDefined();
        // Fallback name is ID
        expect(merged?.name).toBe('A_B');
    });

    it('should preserve position (insert at first merged participant)', () => {
        const root = createBaseAst();
        // Current order: A, B, C
        // Merge A and C. Result should be: MergedAC, B.
        // (A is index 0, C is index 2. Insert at 0).
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'AC' },
            selector: { kind: 'participant', id: { pattern: '^[AC]$' } },
        });

        const result = filter.transform(root);
        const pIds = result.participants.map(p => p.id);
        
        expect(pIds).toEqual(['AC', 'B']);
    });

    it('should existing participant position if merging into existing one', () => {
        const root = createBaseAst();
        // Order: A, B, C.
        // Merge A and B into C.
        // Result should be: C. (A and B removed. C stays at index 2? Or C stays relative to others?)
        // If A and B removed, only C remains.
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'C' }, // Merging into C
            selector: { kind: 'participant', id: { pattern: '^[AB]$' } },
        });

        const result = filter.transform(root);
        const pIds = result.participants.map(p => p.id);
        
        // A and B removed. C remains.
        expect(pIds).toEqual(['C']);
        
        // What if we merge B into A?
        // Order: A, B, C.
        // Merge B into A.
        // Result: A, C.
        const root2 = createBaseAst();
        const filter2 = new MergeFilter({
            action: 'merge',
            into: { id: 'A' },
            selector: { kind: 'participant', id: { pattern: '^B$' } },
        });
        const result2 = filter2.transform(root2);
        // A (kept), B (removed), C (kept). 
        // Wait, "merging B into A". Ideally A stays where it is.
        // B moves to A effectively.
        expect(result2.participants.map(p => p.id)).toEqual(['A', 'C']);
    });

    it('should rewrite message endpoints', () => {
        const root = createBaseAst();
        root.events = [
            { kind: 'message', id: 'm1', from: 'C', to: 'A', text: 'req', type: 'sync', style: { line: 'solid', head: 'arrow' } },
            { kind: 'message', id: 'm2', from: 'B', to: 'C', text: 'res', type: 'reply', style: { line: 'dotted', head: 'open' } },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'AB' },
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        const events = result.events as any[];

        expect(events[0].to).toBe('AB');
        expect(events[1].from).toBe('AB');
    });

    it('should remove internal messages between merged participants', () => {
        const root = createBaseAst();
        root.events = [
            { kind: 'message', id: 'm1', from: 'A', to: 'B', text: 'internal', type: 'sync', style: { line: 'solid', head: 'arrow' } },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'AB' },
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        expect(result.events).toHaveLength(0);
    });

    it('should remove activations of merged participants', () => {
        const root = createBaseAst();
        root.events = [
            { kind: 'activation', participantId: 'A', action: 'activate' },
            { kind: 'activation', participantId: 'C', action: 'activate' },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'AB' },
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        const events = result.events as any[];
        
        expect(events).toHaveLength(1);
        expect(events[0].participantId).toBe('C');
    });

    it('should remove internal notes', () => {
         const root = createBaseAst();
        root.events = [
            { kind: 'note', id: 'n1', text: 'Internal Note', position: 'over', participantIds: ['A', 'B'] },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'AB' },
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        expect(result.events).toHaveLength(0);
    });

     it('should keep shared notes but rename participants', () => {
         const root = createBaseAst();
        root.events = [
            { kind: 'note', id: 'n1', text: 'Shared Note', position: 'over', participantIds: ['A', 'C'] },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'AB' },
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        const note = result.events[0] as any;
        expect(note.participantIds).toContain('AB');
        expect(note.participantIds).toContain('C');
        expect(note.participantIds).toHaveLength(2);
    });

    it('should remove empty fragments', () => {
        const root = createBaseAst();
        root.events = [
            { 
                kind: 'fragment', id: 'f1', operator: 'alt', branches: [
                    { 
                        id: 'b1', 
                        events: [
                             { kind: 'message', id: 'm1', from: 'A', to: 'B', text: 'internal', type: 'sync', style: { line: 'solid', head: 'arrow' } }
                        ] 
                    }
                ] 
            },
        ];
        
        const filter = new MergeFilter({
            action: 'merge',
            into: { id: 'AB' },
            selector: { kind: 'participant', name: { pattern: 'Service [AB]' } },
        });

        const result = filter.transform(root);
        expect(result.events).toHaveLength(0);
    });
});
