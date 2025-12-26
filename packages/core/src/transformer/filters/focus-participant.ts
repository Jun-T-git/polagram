
import { ActivationNode, EventNode, MessageNode, NoteNode, PolagramRoot } from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import { TransformRule } from '../types';

export class FocusParticipantFilter extends Walker {
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
                // Matcher now handles both ID and Name checks
                if (this.matcher.match(p, selector)) {
                    this.targetParticipantIds.add(p.id);
                }
            });
        }
    }

    protected visitEvent(node: EventNode): EventNode[] {
        const selector = this.rule.selector;

        if (selector.kind === 'participant') {
            if (node.kind === 'message') {
                const msg = node as MessageNode;
                if (!this.isRelatedToParticipant(msg)) {
                    return []; // Drop irrelevant message
                }
            }
            
            if (node.kind === 'note') {
                const note = node as NoteNode;
                const isRelated = note.participantIds.some(pid => this.targetParticipantIds.has(pid));
                if (!isRelated) return [];
            }

            if (node.kind === 'activation') {
                const activation = node as ActivationNode;
                if (!this.targetParticipantIds.has(activation.participantId)) {
                    return [];
                }
            }
        }
        
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
