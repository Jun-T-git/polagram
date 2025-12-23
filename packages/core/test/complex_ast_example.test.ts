// packages/core/test/complex_ast_example.test.ts
import { describe, expect, it } from 'vitest';
import type { AyatoriRoot } from '../src/ast';

describe('Ayatori AST Definition', () => {
  it('should support a complex lossless scenario', () => {
    // This "Rosetta Stone" object attempts to use ALL new features
    // to prove they are correctly typed and coexist.
    
    const complexAst: AyatoriRoot = {
      kind: 'root',
      meta: {
        version: '1.0.0',
        source: 'plantuml',
        title: 'Complex Order System',
        theme: {
          participantPadding: '10'
        }
      },
      groups: [
        {
          kind: 'group',
          id: 'g_1',
          name: 'AWS Cloud',
          type: 'box',
          participantIds: ['p_db', 'p_sqs'],
          style: { backgroundColor: '#f0f0f0' }
        }
      ],
      participants: [
        {
          id: 'p_user',
          name: 'User',
          type: 'actor'
        },
        {
          id: 'p_api',
          name: 'API Gateway',
          type: 'control'
        },
        {
          id: 'p_sqs',
          name: 'Order Queue',
          type: 'queue'
        },
        {
          id: 'p_db',
          name: 'DynamoDB',
          type: 'database'
        }
      ],
      events: [
        // 1. Found message (from unknown)
        {
          kind: 'message',
          id: 'm_1',
          from: null,
          to: 'p_user',
          text: 'User lands on page',
          type: 'sync',
          style: { line: 'solid', head: 'arrow' }
        },
        // 2. Activation independent of message
        {
          kind: 'activation',
          participantId: 'p_user',
          action: 'activate'
        },
        // 3. Message with lifecycle
        {
          kind: 'message',
          id: 'm_2',
          from: 'p_user',
          to: 'p_api',
          text: 'POST /order',
          type: 'sync',
          style: { line: 'solid', head: 'arrow' },
          lifecycle: { activateTarget: true }
        },
        // 4. Create message (Lifecycle)
        {
          kind: 'message',
          id: 'm_3',
          from: 'p_api',
          to: 'p_sqs',
          text: 'new OrderMessage()',
          type: 'create', // Explicit create
          style: { line: 'dotted', head: 'arrow' }
        },
        // 5. Visual Divider
        {
          kind: 'divider',
          id: 'd_1',
          text: 'Async Processing'
        },
        // 6. Visual Spacer (Delay)
        {
          kind: 'spacer',
          id: 's_1',
          text: '... 5 seconds later ...'
        },
        // 7. Grouping/Fragment (Loop)
        {
          kind: 'fragment',
          id: 'f_1',
          operator: 'loop',
          branches: [
            {
              id: 'b_1',
              condition: 'Every 1s',
              events: [
                {
                  kind: 'message',
                  id: 'm_poll',
                  from: 'p_db',
                  to: 'p_sqs',
                  text: 'Check items',
                  type: 'sync',
                  style: { line: 'solid', head: 'arrow' }
                }
              ]
            }
          ]
        },
        // 8. Reference (Ref)
        {
          kind: 'ref',
          id: 'r_1',
          text: 'Payment Processing',
          link: 'payment.mermaid',
          participantIds: ['p_api', 'p_db']
        },
        // 9. Destroy (Lifecycle)
        {
          kind: 'message',
          id: 'm_del',
          from: 'p_api',
          to: 'p_sqs',
          text: 'delete',
          type: 'destroy',
          style: { line: 'solid', head: 'cross' } // X marker
        }
      ]
    };
    
    expect(complexAst).toBeTruthy();
    expect(complexAst.participants.length).toBe(4);
    expect(complexAst.events.length).toBe(9);
  });
});
