import type { EventNode, FragmentNode } from '../../ast';
import { Matcher } from '../selector/matcher';
import { Walker } from '../traverse/walker';
import type { ResolveLayer } from '../types';

export class ResolveFilter extends Walker {
  private matcher = new Matcher();

  constructor(private layer: ResolveLayer) {
    super();
  }

  protected visitFragment(node: FragmentNode): EventNode[] {
    // 1. Check if ANY branch matches the selector
    // The layer.selector is a FragmentSelector (which matches branch properties)
    const matchedBranch = node.branches.find((branch) =>
      this.matcher.matchBranch(branch, this.layer.selector, node.operator),
    );

    if (matchedBranch) {
      // RESOLVE ACTION:
      // "Promote" the selected branch by returning its content.
      // The FragmentNode itself is replaced by these events.
      return this.mapEvents(matchedBranch.events);
    }

    // 2. If no match, behave like default (Keep fragment, recurse into children)
    return super.visitFragment(node);
  }
}
