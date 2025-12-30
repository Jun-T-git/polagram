
import { describe, expect, it, vi } from 'vitest';
import { MessageNode, PolagraphRoot } from '../../ast';
import { PolagraphVisitor } from '../interface';
import { Traverser } from './walker';

describe('Traverser', () => {
    it('should dispatch visitRoot', () => {
        const mockVisitor: PolagraphVisitor = {
            visitRoot: vi.fn(),
            visitParticipant: vi.fn(),
            visitParticipantGroup: vi.fn(),
            visitMessage: vi.fn(),
            visitFragment: vi.fn(),
            visitNote: vi.fn(),
            visitActivation: vi.fn(),
            visitDivider: vi.fn(),
            visitSpacer: vi.fn(),
            visitReference: vi.fn()
        };
        
        const traverser = new Traverser(mockVisitor);
        const root: PolagraphRoot = { kind: 'root', meta: { version: '1.0.0', source: 'unknown' }, participants: [], groups: [], events: [] };
        
        traverser.traverse(root);
        
        expect(mockVisitor.visitRoot).toHaveBeenCalledWith(root);
    });

    it('should dispatch events based on kind', () => {
        const mockVisitor: PolagraphVisitor = {
            visitRoot: vi.fn(), // Root visitor might internally call dispatchEvents
            visitParticipant: vi.fn(),
            visitParticipantGroup: vi.fn(),
            visitMessage: vi.fn(),
            visitFragment: vi.fn(),
            visitNote: vi.fn(),
            visitActivation: vi.fn(),
            visitDivider: vi.fn(),
            visitSpacer: vi.fn(),
            visitReference: vi.fn()
        };
        
        const traverser = new Traverser(mockVisitor);
        const msg: MessageNode = { 
            kind: 'message', 
            id: '1', 
            from: 'A', 
            to: 'B', 
            text: 'hi', 
            type: 'sync', 
            style: { line: 'solid', head: 'arrow' } 
        };

        // Directly call dispatchEvents (as if called from visitRoot implementation)
        traverser.dispatchEvents([msg]);
        
        expect(mockVisitor.visitMessage).toHaveBeenCalledWith(msg);
    });
});
