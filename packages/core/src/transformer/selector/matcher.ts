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
            case 'fragment':
                // Branch is usually checked specifically inside fragments
                break;
        }
        return false;
    }

    public matchBranch(branch: FragmentBranch, selector: Selector): boolean {
        if (selector.kind !== 'fragment') return false;
        
        // Match by id (most specific)
        if (selector.id && branch.id !== selector.id) return false;
        
        // Match by text
        if (selector.text && branch.condition && !this.matchText(branch.condition, selector.text)) return false;
        
        // Match by class (if implemented in AST)
        // if (selector.class && ...) return false;
        
        return true;
    }

    // -- Specific Matchers --

    private matchParticipant(node: Participant, selector: ParticipantSelector): boolean {
        // Match by explicit id selector
        if (selector.id && node.id !== selector.id) return false;
        
        // Match by text selector (should match either id or name for flexibility)
        if (selector.text) {
            const matchesId = this.matchText(node.id, selector.text);
            const matchesName = this.matchText(node.name, selector.text);
            if (!matchesId && !matchesName) return false;
        }
        
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
