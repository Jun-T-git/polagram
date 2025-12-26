
import { EventNode, MessageNode, PolagramRoot } from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import { TransformRule } from '../types';

export class HideParticipantFilter extends Walker {
    private matcher = new Matcher();
    private targetParticipantIds = new Set<string>();

    constructor(private rule: TransformRule) {
        super();
    }

    public transform(root: PolagramRoot): PolagramRoot {
        this.resolveTargetParticipants(root);
        return super.transform(root);
    }

    private resolveTargetParticipants(root: PolagramRoot) {
        this.targetParticipantIds.clear();
        const selector = this.rule.selector;
        
        if (selector.kind === 'participant') {
             root.participants.forEach(p => {
                if (this.matcher.match(p, selector)) {
                    this.targetParticipantIds.add(p.id);
                }
            });
        }
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
            if (this.isRelatedToParticipant(msg)) {
                return [];
            }
        }

        // Delegate to super (which handles recursion)
        return super.visitEvent(node);
    }
    
    // Helper to check if message involves the participant from selector
    private isRelatedToParticipant(msg: MessageNode): boolean {
        // Check if from or to matches any targeted participant ID
        if (msg.from && this.targetParticipantIds.has(msg.from)) return true;
        if (msg.to && this.targetParticipantIds.has(msg.to)) return true;
        return false;
    }
}
