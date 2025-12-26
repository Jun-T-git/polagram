import { FragmentBranch, MessageNode, Participant, ParticipantGroup } from '../../ast';
import {
    GroupSelector,
    MessageSelector,
    ParticipantSelector,
    Selector,
    TextMatcher
} from '../types';

export class Matcher {
    
    public match(node: any, selector: Selector): boolean {
        switch (selector.kind) {
            case 'participant':
                // Check if node looks like a Participant
                if (Reflect.has(node, 'type') && Reflect.has(node, 'name')) {
                    return this.matchParticipant(node as Participant, selector);
                }
                break;
            case 'message':
                if (node.kind === 'message') {
                    return this.matchMessage(node as MessageNode, selector);
                }
                break;
            case 'group':
                if (node.kind === 'group') {
                    return this.matchGroup(node as ParticipantGroup, selector);
                }
                break;
            case 'branch':
                // Branch is usually checked specifically inside fragments
                break;
        }
        return false;
    }

    public matchBranch(branch: FragmentBranch, selector: Selector): boolean {
        if (selector.kind !== 'branch') return false;
        if (!branch.condition) return false;
        return this.matchText(branch.condition, selector.text);
    }

    // -- Specific Matchers --

    private matchParticipant(node: Participant, selector: ParticipantSelector): boolean {
        if (selector.text && !this.matchText(node.name, selector.text)) return false;
        if (selector.id && node.id !== selector.id) return false;
        // if (selector.class && ...) // Class/Stereotype not yet strictly defined in AST but reserved
        return true;
    }

    private matchMessage(node: MessageNode, selector: MessageSelector): boolean {
        if (selector.text && !this.matchText(node.text, selector.text)) return false;
        if (selector.from && node.from !== selector.from) return false;
        if (selector.to && node.to !== selector.to) return false;
        return true;
    }

    private matchGroup(node: ParticipantGroup, selector: GroupSelector): boolean {
        if (selector.text && node.name && !this.matchText(node.name, selector.text)) return false;
        return true;
    }

    // -- Helpers --

    private matchText(actual: string, matcher: TextMatcher): boolean {
        if (typeof matcher === 'string') {
            return actual.includes(matcher); // Default: Partial match
        }
        if (matcher instanceof RegExp) {
            return matcher.test(actual);
        }
        if (typeof matcher === 'object' && matcher.pattern) {
            const flags = matcher.flags || '';
            const regex = new RegExp(matcher.pattern, flags);
            return regex.test(actual);
        }
        return false;
    }
}
