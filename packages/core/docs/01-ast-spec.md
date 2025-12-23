# Ayatori AST Specification & Mermaid Mapping

This document serves as the "Rosetta Stone" between Mermaid sequence diagram syntax and Ayatori Abstract Syntax Tree (AST).

*   **Status Legend:**
    *   ✅ **IMPLEMENTED**: Fully supported in current parser.
    *   🚧 **PARTIAL**: Partially supported (e.g., basic syntax works, but nuances missed).
    *   ❌ **PENDING**: Not yet implemented.

---

## 1. Header & Meta

| ID | Description | Mermaid Example | Expected AST (JSON) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **META_HEADER** | Basic sequence diagram definition | `sequenceDiagram` | <pre>{<br>  "kind": "root",<br>  "meta": { "source": "mermaid" }<br>}</pre> | ✅ |
| **META_TITLE** | Diagram title | `title: My Diagram` | <pre>{<br>  "kind": "root",<br>  "meta": { "title": "My Diagram" }<br>}</pre> | ✅ |

---

## 2. Participants

| ID | Description | Mermaid Example | Expected AST (JSON) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PARTICIPANT_BASIC** | Explicit participant | `participant Alice` | <pre>{<br>  "id": "Alice",<br>  "name": "Alice",<br>  "type": "participant"<br>}</pre> | ✅ |
| **PARTICIPANT_ALIAS** | Participant with alias | `participant A as Alice` | <pre>{<br>  "id": "A",<br>  "name": "Alice",<br>  "type": "participant"<br>}</pre> | ✅ |
| **ACTOR_DEF** | Actor definition | `actor Bob` | <pre>{<br>  "id": "Bob",<br>  "name": "Bob",<br>  "type": "actor"<br>}</pre> | ✅ |

---

## 3. Messages & Arrows

| ID | Description | Mermaid Example | Expected AST (JSON) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **MSG_SYNC_SOLID** | Solid line (Basic) | `A->B: Text` | <pre>{<br>  "kind": "message",<br>  "type": "sync",<br>  "style": { "line": "solid", "head": "arrow" }<br>}</pre> | ✅ |
| **MSG_SYNC_SOLID_ARROW** | Solid line with arrow | `A->>B: Text` | <pre>{<br>  "kind": "message",<br>  "type": "sync",<br>  "style": { "line": "solid", "head": "arrow" }<br>}</pre> | ✅ |
| **MSG_ASYNC_DOTTED** | Dotted line (Reply) | `A-->B: Text` | <pre>{<br>  "kind": "message",<br>  "type": "reply",<br>  "style": { "line": "dotted", "head": "open" }<br>}</pre> | ✅ |
| **MSG_ASYNC_DOTTED_ARROW** | Dotted line with arrow | `A-->>B: Text` | <pre>{<br>  "kind": "message",<br>  "type": "reply",<br>  "style": { "line": "dotted", "head": "arrow" }<br>}</pre> | ✅ |
| **MSG_OPEN_ARROW** | Async open arrow | `A-)B: Text` | <pre>{<br>  "kind": "message",<br>  "type": "async",<br>  "style": { "line": "solid", "head": "async" }<br>}</pre> | ✅ |
| **MSG_CROSS** | Destroy / Lost | `A-xB: Text` | <pre>{<br>  "kind": "message",<br>  "type": "destroy",<br>  "style": { "line": "solid", "head": "cross" }<br>}</pre> | ✅ |

---

## 4. Activations (Lifecycle)

| ID | Description | Mermaid Example | Expected AST (JSON) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ACTIVATE_CMD** | Explicit activate | `activate A` | <pre>{<br>  "kind": "activation",<br>  "participantId": "A",<br>  "action": "activate"<br>}</pre> | ✅ |
| **DEACTIVATE_CMD** | Explicit deactivate | `deactivate A` | <pre>{<br>  "kind": "activation",<br>  "participantId": "A",<br>  "action": "deactivate"<br>}</pre> | ✅ |
| **ACTIVATE_SUFFIX** | Activate via suffix | `A->>+B: Text` | <pre>{<br>  "kind": "message",<br>  "lifecycle": { "activateTarget": true }<br>}</pre> | ✅ |
| **DEACTIVATE_SUFFIX** | Deactivate via suffix | `B-->>-A: Text` | <pre>{<br>  "kind": "message",<br>  "lifecycle": { "deactivateSource": true }<br>}</pre> | ✅ |

---

## 5. Fragments & Grouping

| ID | Description | Mermaid Example | Expected AST (JSON) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FRAG_LOOP** | Loop block | `loop Check`<br>`...`<br>`end` | <pre>{<br>  "kind": "fragment",<br>  "operator": "loop",<br>  "branches": [{ "condition": "Check" }]<br>}</pre> | ✅ |
| **FRAG_ALT** | Alt/Else block | `alt OK`<br>`...`<br>`else NG`<br>`...`<br>`end` | <pre>{<br>  "kind": "fragment",<br>  "operator": "alt",<br>  "branches": [<br>    { "condition": "OK" },<br>    { "condition": "NG" }<br>  ]<br>}</pre> | ✅ |
| **FRAG_OPT** | Optional block | `opt Maybe`<br>`...`<br>`end` | <pre>{<br>  "kind": "fragment",<br>  "operator": "opt",<br>  "branches": [{ "condition": "Maybe" }]<br>}</pre> | ✅ |
| **GROUP_BOX** | Box (Grouping) | `box "Title" #color`<br>`participant A`<br>`end` | <pre>{<br>  "kind": "group",<br>  "type": "box",<br>  "name": "Title",<br>  "style": { "backgroundColor": "#color" },<br>  "participantIds": ["A"]<br>}</pre> | ✅ |
| **FRAG_PAR** | Parallel block | `par A`<br>`...`<br>`and B`<br>`...`<br>`end` | <pre>{<br>  "kind": "fragment",<br>  "operator": "par",<br>  "branches": [<br>    { "condition": "A" },<br>    { "condition": "B" }<br>  ]<br>}</pre> | ❌ |

---

## 6. Notes

| ID | Description | Mermaid Example | Expected AST (JSON) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NOTE_RIGHT** | Note right of | `note right of A: Text` | <pre>{<br>  "kind": "note",<br>  "position": "right",<br>  "participantIds": ["A"],<br>  "text": "Text"<br>}</pre> | ✅ |
| **NOTE_OVER** | Note over | `note over A,B: Text` | <pre>{<br>  "kind": "note",<br>  "position": "over",<br>  "participantIds": ["A", "B"],<br>  "text": "Text"<br>}</pre> | ✅ |
