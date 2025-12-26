
import { EventNode, FragmentNode } from '../../ast';
import { Walker } from '../traverse/walker';

/**
 * Cleaner that removes empty fragments and branches from the AST.
 * This runs after filters to ensure the AST structure remains valid/clean.
 */
export class StructureCleaner extends Walker {
    
    protected visitFragment(node: FragmentNode): EventNode[] {
        // 1. Let super map the branches (recurse)
        const result = super.visitFragment(node);
        
        // Should contain exactly one node (the fragment with mapped branches)
        if (result.length === 0) return [];
        const fragment = result[0] as FragmentNode;

        // 2. Filter out empty branches
        // A branch is "empty" if it has 0 events.
        const validBranches = fragment.branches.filter(b => b.events.length > 0);

        // 3. Evaluation
        if (validBranches.length === 0) {
            return []; // Remove fragment entirely
        }

        // Return updated fragment
        return [{
            ...fragment,
            branches: validBranches
        }];
    }
}
