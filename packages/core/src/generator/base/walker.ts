
import { EventNode, PolagramRoot } from '../../ast';
import { PolagramVisitor } from '../interface';

/**
 * Helper class to traverse AST nodes and dispatch to the visitor.
 */
export class Traverser {
  
  constructor(private visitor: PolagramVisitor) {}

  public traverse(root: PolagramRoot) {
    this.visitor.visitRoot(root);
  }

  /**
   * Dispatches a single event node to the appropriate visitor method.
   * This is public so Visitors can call it recursively (e.g. inside Fragments/Groups).
   */
  public dispatchEvent(node: EventNode) {
    switch (node.kind) {
      case 'message':
        this.visitor.visitMessage(node);
        break;
      case 'fragment':
        this.visitor.visitFragment(node);
        break;
      case 'note':
        this.visitor.visitNote(node);
        break;
      case 'activation':
        this.visitor.visitActivation(node);
        break;
      case 'divider':
        this.visitor.visitDivider(node);
        break;
      case 'spacer':
        this.visitor.visitSpacer(node);
        break;
      case 'ref':
        this.visitor.visitReference(node);
        break;
      default:
        // Unknown node type
        break;
    }
  }

  /**
   * Helper to iterate over a list of events.
   */
  public dispatchEvents(events: EventNode[]) {
    for (const event of events) {
      this.dispatchEvent(event);
    }
  }
}
