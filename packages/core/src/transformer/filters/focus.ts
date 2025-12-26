
import { ActivationNode, EventNode, MessageNode, NoteNode } from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import { TransformRule } from '../types';

export class FocusFilter extends Walker {
    private matcher = new Matcher();

    constructor(private rule: TransformRule) {
        super();
    }

    protected visitEvent(node: EventNode): EventNode[] {
        const selector = this.rule.selector;

        if (selector.kind === 'participant') {
            if (node.kind === 'message') {
                const msg = node as MessageNode;
                if (!this.isRelatedToParticipant(msg, selector)) {
                    return []; // Drop irrelevant message
                }
            }
            
            if (node.kind === 'note') {
                const note = node as NoteNode;
                const isRelated = note.participantIds.some(pid => {
                    const p = { name: pid, id: pid, type: 'participant' }; 
                    return this.matcher.match(p, selector);
                });
                if (!isRelated) return [];
            }

            if (node.kind === 'activation') {
                const activation = node as ActivationNode;
                const p = { name: activation.participantId, id: activation.participantId, type: 'participant' };
                if (!this.matcher.match(p, selector)) {
                    return [];
                }
            }
        }
        
        return super.visitEvent(node);
    }

    // Helper to check if message involves the participant from selector
    private isRelatedToParticipant(msg: MessageNode, selector: any): boolean {
        // We assume selector.kind === 'participant'
        const fromP = { name: msg.from || '', id: msg.from || '', type: 'participant' }; 
        if (this.matcher.match(fromP, selector)) return true;
        
        const toP = { name: msg.to || '', id: msg.to || '', type: 'participant' };
        if (this.matcher.match(toP, selector)) return true;
        
        return false;
    }
}
