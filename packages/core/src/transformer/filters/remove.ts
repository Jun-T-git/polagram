
import { EventNode, MessageNode } from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import { TransformRule } from '../types';

export class RemoveFilter extends Walker {
    private matcher = new Matcher();

    constructor(private rule: TransformRule) {
        super();
    }

    protected visitEvent(node: EventNode): EventNode[] {
        const selector = this.rule.selector;

        // Straightforward: If match, return empty array.
        if (this.matcher.match(node, selector)) {
            return [];
        }

        // Logic for "Removing Participant":
        // If selector is participant, we must also remove messages involving them.
        if (selector.kind === 'participant' && node.kind === 'message') {
            const msg = node as MessageNode;
            if (this.isRelatedToParticipant(msg, selector)) {
                return [];
            }
        }

        // Delegate to super (which handles recursion)
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
