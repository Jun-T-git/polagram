# Design: Scenario Extraction (Progressive Disclosure)

This document outlines the architecture for the **Scenario Extraction** engine.
Tests and implementation will follow this specification.

## 1. Philosophy: Select & Act

> **"Find the target, then apply the change."**

We transform the AST by filtering and rewriting nodes based on user queries.
We adopt the **Transformer Pattern** (Updating Visitor) to safely modify the tree structure in a single pass.

## 2. Architecture: Transformer Pattern

Instead of collecting IDs (2-pass), we use a **Tree Transformer**.
The Engine walks the tree, and for each node, it decides whether to **Keep**, **Remove**, or **Replace** it.

```mermaid
flowchart LR
    Source[Raw AST] -- Rules --> Engine[Transformation Engine]
    
    subgraph Engine
        Loop[For each Rule]
            Pass[Tree Traversal]
            Decision{Match Selector?}
            
            Pass --> Decision
            Decision -- Yes --> Action[Apply Action\n(Hide/FocusFragment)]
            Decision -- No --> Keep[Keep Node]
            
            Action --> NewTree
            Keep --> NewTree
        end
    end
    
    Engine --> Result[Scenario AST]
```

## 3. Data Structures

### 3.1 Transform Rule

```typescript
export interface TransformRule {
  action: 'focusFragment' | 'hideParticipant' | 'focusParticipant';
  selector: Selector;
}
```

### 3.2 Selector (Unified Interface)

We use a **Discriminated Union** with a unified `text` property.
`TextMatcher` supports both strings and serializable RegExp-like objects for JSON compatibility.

```typescript
export type TextMatcher = string | RegExp | { pattern: string; flags?: string };

export type Selector = 
  | ParticipantSelector
  | MessageSelector
  | BranchSelector
  | GroupSelector;

export interface ParticipantSelector {
  kind: 'participant';
  text?: TextMatcher;      // e.g. "User" or { pattern: "^User", flags: "i" }
  id?: string;             // e.g. "user_01"
  class?: TextMatcher;     // e.g. "Service"
}

export interface MessageSelector {
  kind: 'message';
  text?: TextMatcher;
  from?: string;
  to?: string; 
  class?: TextMatcher;
}

export interface BranchSelector {
  kind: 'branch';
  text: TextMatcher;
}

export interface GroupSelector {
  kind: 'group';
  text: TextMatcher;
}
```

## 4. Fundamental Strategy: Bubble-Up Filtering

To resolve the "Shallow Focus" structural issues (e.g. empty containers remaining), we adopt a **Bubble-Up (Post-Order)** strategy, primarily for the `Focus` action.

### Logic
1.  **Traverse Children First**: Before deciding the fate of a Container (Fragment/Group), transform its children.
2.  **Evaluate Container**:
    *   If **children are empty** (all filtered out): Remove the Container (return `[]`).
    *   If **children exist**: Keep the Container (return `[node]`).

This ensures that we never render "Empty Loops" or "Empty Groups" caused by filtering.

## 5. Implementation Strategy: The TreeMapper

We introduce a `TreeMapper` base class that implements this traversal logic.

### 5.0 Core Principle: Immutability
**Input AST is Read-Only.** 
The Transformer must never mutate the input nodes. It must always produce a new AST tree (Copy-on-Write).
-   If a node is modified (or its children are), a new object `{...node}` must be returned.
-   If no changes are needed, returning the original reference is technically allowed (Structural Sharing), but simplified implementation might default to shallow copies.

### 5.1 Base `TreeMapper`

It applies a "Map" operation: `Node -> Node[]`.
- `[]`: Remove
- `[Node]`: Keep
- `[Node, Node]`: Replace/Splice

```typescript
abstract class TreeMapper {
  transform(root: PolagramRoot): PolagramRoot {
    // Always return a new Root object
    return {
      ...root,
      events: this.mapEvents(root.events)
    };
  }

  protected mapEvents(events: EventNode[]): EventNode[] {
    return events.flatMap(e => this.visitEvent(e));
  }

  protected visitEvent(node: EventNode): EventNode[] {
    // Default: Recursively map children for Containers
    if (node.kind === 'fragment') {
        const branches = node.branches.map(b => ({
            ...b,
            events: this.mapEvents(b.events)
        })).filter(b => b.events.length > 0); // Cleanup empty branches

        if (branches.length === 0) return []; // Bubble-up: Remove empty fragment
        return [{ ...node, branches }];
    }
    // ... handle group ...
    return [node];
  }
}
```

### 5.2 Concrete Logic

#### `FocusFragmentTransformer`
Splicing Logic via `flatMap`.
- Visit Fragment.
- Find matching Branch.
- If match found: Return `match.events` (Hoisting).
- **Crucial**: The returned events are then *implicitly* merged into the parent array by `flatMap`.

#### `FocusParticipantTransformer`
Implements Bubble-Up.
- `visitEvent(message)`: Check relevance. Return `[]` if irrelevant.
- `visitEvent(fragment)`: Call `super.visitEvent` (which handles the bubble-up cleaning).
