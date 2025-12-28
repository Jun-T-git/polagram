import { FragmentBranch, FragmentOperator, MessageNode, Participant, ParticipantGroup } from '../../ast';
import {
    FragmentSelector,
    GroupSelector,
    MessageSelector,
    ParticipantSelector,
    TextMatcher
} from '../types';

export class Matcher {
    
    // -- Branch / Fragment --

    public matchBranch(branch: FragmentBranch, selector: FragmentSelector, parentOperator: FragmentOperator): boolean {
        // 1. Match Operator (e.g., "loop", "alt")
        if (selector.operator) {
            const ops = Array.isArray(selector.operator) ? selector.operator : [selector.operator];
            if (!ops.includes(parentOperator)) return false;
        }

        // 2. Match Condition Text (e.g., "Success")
        if (selector.condition) {
            if (!branch.condition) return false;
            if (!this.matchText(branch.condition, selector.condition)) return false;
        }

        return true;
    }

    // -- Participant --

    public matchParticipant(node: Participant, selector: ParticipantSelector): boolean {
        if (selector.id && !this.matchText(node.id, selector.id)) return false;
        if (selector.name && !this.matchText(node.name, selector.name)) return false;
        if (selector.stereotype && node.stereotype && !this.matchText(node.stereotype, selector.stereotype)) return false;
        
        return true;
    }

    // -- Message --

    public matchMessage(node: MessageNode, selector: MessageSelector): boolean {
        if (selector.text && !this.matchText(node.text, selector.text)) return false;
        
        // Note: from/to in selector are TextMatchers, so we match against node.from/to (IDs)
        // Ideally this should resolve IDs from Names if possible, but for now we look at raw fields.
        if (selector.from && node.from && !this.matchText(node.from, selector.from)) return false;
        if (selector.to && node.to && !this.matchText(node.to, selector.to)) return false;
        
        return true;
    }

    // -- Group --

    public matchGroup(node: ParticipantGroup, selector: GroupSelector): boolean {
        if (selector.name && node.name && !this.matchText(node.name, selector.name)) return false;
        return true;
    }

    // -- Helpers --

    private matchText(actual: string, matcher: TextMatcher): boolean {
        if (typeof matcher === 'string') {
            return actual === matcher; // Default: Exact match
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
