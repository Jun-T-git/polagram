# Polagraph Core: Lens Interface Specification

This document defines the interface for **Lens**, a mechanism for transforming Sequence Diagram ASTs to generate specific views.

## 1. Core Concepts

| Concept | Definition |
| --- | --- |
| **Lens** | A named collection of transformation layers. Represents a specific "View" or "Perspective". |
| **Layer** | A single transformation step applied sequentially to the AST. |
| **Action** | The behavior of a layer. Strictly defined by the **Target's nature** (Structure vs. Entity). |

### Action Matrix

| Action | Target (Nature) | Frame/Structure | Effect |
| --- | --- | --- | --- |
| **`resolve`** | **Fragment** (Box) | **Removed** 💥 | Destroys the container (alt/opt) and promotes the selected content to the parent level. |
| **`focus`** | **Participant** (Entity) | **Maintained** | Hides participants and interactions not relevant to the selected target. |
| **`remove`** | **Any** | - | Simply deletes the node. No structural side effects. |

---

## 2. Type Definitions

### Lens Structure

```typescript
// packages/core/src/types/lens.ts

/**
 * A named configuration defining how to transform the diagram.
 */
export interface Lens {
  /** Display name of the lens (e.g., "Backend Happy Path") */
  name?: string;
  
  /** Description of what this lens reveals */
  description?: string;
  
  /** Transformation steps applied in order */
  layers: Layer[];
}

/**
 * A single transformation step.
 * Discriminated Union based on 'action' to ensure type safety.
 */
export type Layer = 
  | ResolveLayer 
  | FocusLayer 
  | RemoveLayer;

```

### Layer Definitions

#### A. Resolve Layer (Structure Transformation)

Resolves structural ambiguity (branches) into a determined path.

```typescript
export interface ResolveLayer {
  action: 'resolve';
  
  /**
   * Selects which branch of a FragmentNode to promote.
   * The selected branch's events are moved up; other branches are discarded.
   * The FragmentNode itself is removed.
   */
  selector: BranchSelector;
}

```

#### B. Focus Layer (Entity Filtering)

Narrows the view to specific participants.

```typescript
export interface FocusLayer {
  action: 'focus';
  
  /**
   * Selects the participants to keep.
   * Any messages NOT involving these participants will be hidden.
   * NOTE: Does not remove structural frames (FragmentNodes).
   */
  selector: ParticipantSelector;
}

```

#### C. Remove Layer (Noise Reduction)

Removes arbitrary nodes to clean up the diagram.

```typescript
export interface RemoveLayer {
  action: 'remove';
  
  /**
   * Selects any node (Participant, Message, Group, etc.) to delete.
   */
  selector: ParticipantSelector | MessageSelector | GroupSelector;
}

```

---

## 3. Selector Definitions

Selectors map abstract criteria to AST properties.

```typescript
// packages/core/src/types/selector.ts

import { FragmentOperator } from '../ast';

/**
 * Helper: String exact match or RegExp pattern.
 */
export type TextMatcher = string | { pattern: string; flags?: string };

// -----------------------------------------------------------
// 1. Branch Selector
// Target: FragmentNode / FragmentBranch
// -----------------------------------------------------------
export interface BranchSelector {
  kind?: 'branch'; 
  
  /** Matches the condition text (e.g., "Success", "[x > 0]", "else") */
  condition?: TextMatcher;

  /** * Matches the operator type (e.g., "loop", "opt", "alt").
   * Useful to resolve ALL loops regardless of condition.
   */
  operator?: FragmentOperator | FragmentOperator[];
}

// -----------------------------------------------------------
// 2. Participant Selector
// Target: Participant
// -----------------------------------------------------------
export interface ParticipantSelector {
  kind?: 'participant';

  /** Display Name or Alias */
  name?: TextMatcher;
  
  /** Internal ID */
  id?: TextMatcher;
  
  /** Stereotype (e.g., "<<Service>>", "<<Database>>") */
  stereotype?: TextMatcher;
}

// -----------------------------------------------------------
// 3. Message Selector
// Target: MessageNode / NoteNode
// -----------------------------------------------------------
export interface MessageSelector {
  kind?: 'message';

  /** Message Label (e.g., "GET /api/users") */
  text?: TextMatcher;

  /** Sender / Receiver Name (Resolved to IDs internally) */
  from?: TextMatcher;
  to?: TextMatcher;
}

// -----------------------------------------------------------
// 4. Group Selector
// Target: ParticipantGroup
// -----------------------------------------------------------
export interface GroupSelector {
  kind?: 'group';

  /** Group Label (e.g., "AWS Cloud") */
  name?: TextMatcher;
}

```

---

## 4. Usage Example (YAML)

Example configuration demonstrating the narrative flow of applying layers.

```yaml
# polagraph.yml

lenses:
  # Use Case: Extracting the "Happy Path" for Backend Services
  backend_happy_path:
    description: "Resolves success paths and removes frontend/logging noise."
    layers:
      
      # Step 1: Resolve Structure
      # "Resolve the branching logic by choosing the 'Success' path."
      # -> Result: 'alt' frames disappear, indentation is flattened.
      - action: resolve
        selector:
          condition: "Success"

      # Step 2: Focus on Entities
      # "Focus only on components marked as <<Service>>."
      # -> Result: Actors like 'User' or 'Frontend' are hidden.
      - action: focus
        selector:
          stereotype: "Service"

      # Step 3: Remove Noise
      # "Remove any messages sent to the Logger component."
      # -> Result: Pure business logic flow.
      - action: remove
        selector:
          to: "Logger"

```
