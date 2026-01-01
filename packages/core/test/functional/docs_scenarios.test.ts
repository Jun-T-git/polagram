
import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

const MASTER_DIAGRAM = `sequenceDiagram
    participant User
    participant Web
    participant API
    participant DB
    participant Payment
    
    User->>Web: Order Item
    Web->>Web: Validate Order
    Web->>API: POST /order
    API->>API: Log: Start processing
    
    API->>DB: Get User Info
    DB-->>API: User Data
    
    API->>Payment: Charge(100)
    
    alt Payment Success
        Payment-->>API: OK
        API->>DB: Save Order
        API->>API: Log: Order Saved
        API-->>Web: Success
    else Payment Failed
        Payment-->>API: Error
        API->>API: Log: Payment Failed
        API-->>Web: Error
    end`;

describe('Documentation Scenarios', () => {
    it('PM View: Should remove logs and resolve to happy path', () => {
        const result = Polagram.init(MASTER_DIAGRAM)
            // 1. Remove internal logs
            .removeMessage({ pattern: '^Log:' })
            // 2. Show only the happy path
            .resolveFragment({ condition: 'Payment Success' })
            // 3. Focus on high-level user journey
            .focusParticipant({ pattern: 'User|Web|API|Payment' })
            .toMermaid();

        // Verify "Log" messages are gone
        expect(result).not.toContain('Log:');
        
        // Verify "Log" messages are gone
        expect(result).not.toContain('Log:');
        
        // Verify "DB" interactions are kept because API is focused and it calls DB
        expect(result).toContain('API->>DB');

        // Verify Happy Path resolution
        expect(result).not.toContain('alt Payment Success');
        expect(result).not.toContain('else Payment Failed');
        expect(result).toContain('Payment-->>API: OK');
        expect(result).not.toContain('Payment-->>API: Error');
    });

    it('Dev View: Should focus on backend services', () => {
        const result = Polagram.init(MASTER_DIAGRAM)
            // Focus strictly on backend services
            .focusParticipant({ pattern: 'API|Payment|DB' })
            .toMermaid();

        // User and Web interactions sent FROM them should be gone
        // User->>Web
        expect(result).not.toContain('User->>Web');
        // Web->>API (Web is sender, API is target). 
        // Logic: if API is focused, interactions involving API are KEPT.
        // So Web->>API remains.
        expect(result).toContain('Web->>API');
        
        // Backend services should remain
        expect(result).toContain('participant API');
        expect(result).toContain('participant DB');
        expect(result).toContain('participant Payment');

        // Interactions between backend services should remain
        expect(result).toContain('API->>DB: Get User Info');
        
        // Logs should remain (as they were not removed)
        expect(result).toContain('Log: Start processing');
    });
});
