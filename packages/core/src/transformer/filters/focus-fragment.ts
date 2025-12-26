
import { EventNode, FragmentNode } from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import { TransformRule } from '../types';

export class FocusFragmentFilter extends Walker {
    private matcher = new Matcher();

    constructor(private rule: TransformRule) {
        super();
    }

    protected visitFragment(node: FragmentNode): EventNode[] {
        // 1. Check if ANY branch matches the selector
        // The rule.selector should be a BranchSelector
        const matchedBranch = node.branches.find(branch => 
            this.matcher.matchBranch(branch, this.rule.selector)
        );

        if (matchedBranch) {
            // FOCUS FRAGMENT ACTION (UNWRAP):
            // Instead of returning the fragment, we return the contents of the matched branch.
            // Crucial: We must also recursively map those events!
            // (e.g. if there is a nested focusFragment rule)
            return this.mapEvents(matchedBranch.events);
        }

        // 2. If no match, behave like default (Keep fragment, recurse into children)
        return super.visitFragment(node);
    }
}
