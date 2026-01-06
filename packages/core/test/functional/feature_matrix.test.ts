import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

describe('Feature Matrix: Participant Selectors', () => {
  const CODE_ID_NAME = `
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello
    B->>B: Self
`;
  // Stereotype
  const CODE_STEREOTYPE = `
sequenceDiagram
    participant A <<Service>>
    participant B <<Database>>
    A->>B: Query
    A->>A: Calculation
`;

  it('should select by ID (alias)', () => {
    // Remove by ID "A"
    const result = Polagram.init(CODE_ID_NAME)
      .removeParticipant({ id: 'A' })
      .toMermaid();
    expect(result).not.toContain('participant A as Alice');
    expect(result).not.toContain('A->>B: Hello');
    expect(result).toContain('participant B as Bob');
    expect(result).toContain('B->>B: Self');
  });

  it('should select by Name (label)', () => {
    // Remove by Name "Alice"
    const result = Polagram.init(CODE_ID_NAME)
      .removeParticipant({ name: 'Alice' })
      .toMermaid();
    expect(result).not.toContain('participant A as Alice');
    expect(result).not.toContain('A->>B: Hello');
    expect(result).toContain('participant B as Bob');
    expect(result).toContain('B->>B: Self');
  });

  it.skip('should select by Stereotype (remove)', () => {
    // TODO: Enable when PlantUML parser is implemented.
    // Mermaid parser does not currently support stereotypes (<<Service>>).
    // This test preserves the AST compatibility check for the future.
    // Remove <<Database>>
    const result = Polagram.init(CODE_STEREOTYPE)
      .removeParticipant({ stereotype: 'Database' })
      .toMermaid();
    expect(result).not.toContain('participant B <<Database>>');
    // B removed -> Interaction A->>B removed
    expect(result).not.toContain('A->>B: Query');
    expect(result).toContain('participant A <<Service>>');
    expect(result).toContain('A->>A: Calculation');
  });
});

describe('Feature Matrix: Message Selectors', () => {
  const CODE_MESSAGES = `
sequenceDiagram
    participant A
    participant B
    A->>B: Login
    B-->>A: 200 OK
    A->>B: GetData
    B-->>A: 500 Error
`;

  it('should select by Text Pattern (Regex)', () => {
    const result = Polagram.init(CODE_MESSAGES)
      .removeMessage({ pattern: 'Error' })
      .toMermaid();
    expect(result).toContain('200 OK');
    expect(result).not.toContain('500 Error');
  });

  it('should select by Sender (From)', () => {
    // Remove all messages form A
    const result = Polagram.init(CODE_MESSAGES)
      .removeMessage({ from: 'A' })
      .toMermaid();
    expect(result).not.toContain('A->>B: Login');
    expect(result).toContain('B-->>A: 200 OK');
    expect(result).not.toContain('A->>B: GetData');
    expect(result).toContain('B-->>A: 500 Error');
  });

  it('should select by Receiver (To)', () => {
    // Remove all messages to B
    const result = Polagram.init(CODE_MESSAGES)
      .removeMessage({ to: 'B' })
      .toMermaid();
    expect(result).not.toContain('A->>B: Login');
    expect(result).toContain('B-->>A: 200 OK');
  });
});

/*
describe('Feature Matrix: Group Selectors', () => {
    // Note: Mermaid format handles boxes as container, but Polagram AST handles them as root-level descriptors
    const CODE_GROUPS = `
sequenceDiagram
    box "Internal System" #LightBlue
        participant A
        participant B
    end
    participant C
    A->>C: Hello
`;
    // Mermaid generator currently ignores boxes, so this test is not verifiable via output string
    // it('should remove group by Name', () => {
    //     const result = Polagram.init(CODE_GROUPS).removeGroup({ name: 'Internal System' }).toMermaid();
    //     expect(result).not.toContain('box "Internal System" #LightBlue');
    //     expect(result).not.toContain('end');
    //     expect(result).toContain('participant A');
    //     expect(result).toContain('participant B');
    // });
});
*/

describe('Feature Matrix: Fragment Selectors', () => {
  const CODE_FRAGMENTS = `
sequenceDiagram
    loop Retry Policy
        A->>B: Ping
    end
    opt Cache Hit
        A->>A: Read Cache
    end
    alt Auth
        A->>B: Login
    else Guest
        A->>B: Hello
    end
`;

  it('should resolve loop (unwrap contents)', () => {
    // Resolve loop matches any loop? condition selector matches the label.
    const result = Polagram.init(CODE_FRAGMENTS)
      .resolveFragment({
        operator: 'loop',
        condition: { pattern: '.*' }, // Match any loop
      })
      .toMermaid();

    expect(result).not.toContain('loop Retry Policy');
    expect(result).toContain('A->>B: Ping');
  });

  it('should resolve opt (unwrap contents)', () => {
    const result = Polagram.init(CODE_FRAGMENTS)
      .resolveFragment({
        operator: 'opt',
        condition: 'Cache Hit',
      })
      .toMermaid();

    expect(result).not.toContain('opt Cache Hit');
    expect(result).toContain('A->>A: Read Cache');
  });
});

describe('Feature Matrix: Chained Actions', () => {
  const CODE_CHAIN = `
sequenceDiagram
    participant A
    participant B
    loop Retry
        A->>B: Try
        note over B: Error
    end
    A->>A: Self
`;

  it('should handle chained transformations (resolve -> remove)', () => {
    const result = Polagram.init(CODE_CHAIN)
      // 1. Resolve loop (unwrap A->>B and note)
      .resolveFragment({ operator: 'loop', condition: 'Retry' })
      // 2. Remove B (should remove A->>B and note over B)
      .removeParticipant({ name: 'B' })
      .toMermaid();

    expect(result).not.toContain('loop Retry'); // Resolved
    expect(result).not.toContain('participant B'); // Removed

    // Interaction A->>B should be removed because B is gone
    expect(result).not.toContain('A->>B: Try');

    // Note over B should be removed because B is gone
    expect(result).not.toContain('note over B');

    // A should remain
    expect(result).toContain('participant A');
    expect(result).toContain('A->>A: Self');
  });
});
