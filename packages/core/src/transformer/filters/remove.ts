
import { ActivationNode, EventNode, MessageNode, NoteNode, PolagraphRoot } from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import { RemoveLayer } from '../types';

export class RemoveFilter extends Walker {
    private matcher = new Matcher();
    private removedParticipantIds = new Set<string>();

    constructor(private layer: RemoveLayer) {
        super();
    }

    public transform(root: PolagraphRoot): PolagraphRoot {
        const selector = this.layer.selector;

        // 1. Pre-calculate removed participants
        if (selector.kind === 'participant') {
            root.participants.forEach(p => {
                if (this.matcher.matchParticipant(p, selector)) {
                    this.removedParticipantIds.add(p.id);
                }
            });
            // Also remove the participants from definitions
            root.participants = root.participants.filter(p => !this.removedParticipantIds.has(p.id));
        }

        // 2. Remove Groups
        if (selector.kind === 'group') {
            root.groups = root.groups.filter(g => !this.matcher.matchGroup(g, selector));
        }

        return super.transform(root);
    }

    protected visitEvent(node: EventNode): EventNode[] {
        const selector = this.layer.selector;

        // A. Remove by Message Selector
        if (selector.kind === 'message') {
            if (node.kind === 'message') {
                if (this.matcher.matchMessage(node as MessageNode, selector)) {
                    return [];
                }
            }
            // Note: Message selector doesn't apply to other event types
        }

        // B. Remove by Participant (Cascade to events)
        if (selector.kind === 'participant') {
            if (node.kind === 'message') {
                const msg = node as MessageNode;
                if (this.isRelatedToRemovedParticipant(msg)) return [];
            }
            if (node.kind === 'note') {
                const note = node as NoteNode;
                const isRelated = note.participantIds.some(pid => this.removedParticipantIds.has(pid));
                if (isRelated) return [];
            }
            if (node.kind === 'activation') {
                const activation = node as ActivationNode;
                if (this.removedParticipantIds.has(activation.participantId)) return [];
            }
        }

        return super.visitEvent(node);
    }

    private isRelatedToRemovedParticipant(msg: MessageNode): boolean {
        if (msg.from && this.removedParticipantIds.has(msg.from)) return true;
        if (msg.to && this.removedParticipantIds.has(msg.to)) return true;
        return false;
    }
}
