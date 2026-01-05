import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

function normalize(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("'"))
    .join('\n');
}

describe('PlantUML Transformation Scenarios', () => {
  describe('PM View (Product Manager View)', () => {
    const pmDiagram = `@startuml
participant User
participant WebUI
participant API
participant Logger
participant Database

User -> WebUI: Click Buy
WebUI -> API: POST /purchase
API -> Logger: Log: Purchase initiated
Logger --> API: OK

alt Payment Success
    API -> Database: Save order
    Database --> API: Order ID
    API --> WebUI: 200 OK
    WebUI --> User: Success message
else Payment Failed
    API -> Database: Log failure
    Database --> API: OK
    API --> WebUI: 400 Error
    WebUI --> User: Error message
end

API -> Logger: Log: Purchase completed
@enduml`;

    it('should create PM-friendly view by removing technical details', () => {
      const result = Polagram.init(pmDiagram, 'plantuml')
        .removeMessage({ pattern: '^Log:' })
        .resolveFragment({ condition: 'Payment Success' })
        .removeParticipant('Logger')
        .toPlantUML();
      
      const normalized = normalize(result);
      
      // Technical details removed
      expect(normalized).not.toContain('Logger');
      expect(normalized).not.toContain('Log:');
      
      // Happy path preserved
      expect(normalized).toContain('API -> Database: Save order');
      expect(normalized).toContain('Success message');
      
      // Error path removed
      expect(normalized).not.toContain('Payment Failed');
      expect(normalized).not.toContain('Error message');
    });

    it('should focus on high-level user interactions', () => {
      const result = Polagram.init(pmDiagram, 'plantuml')
        .removeParticipant(/Logger/)
        .resolveFragment({ condition: 'Payment Success' })
        .focusParticipant(/User|WebUI|API/)
        .toPlantUML();
      
      const normalized = normalize(result);
      
      expect(normalized).toContain('User');
      expect(normalized).toContain('WebUI');
      expect(normalized).toContain('API');
      // Database is kept because API interacts with it
      expect(normalized).toContain('Database');
      expect(normalized).not.toContain('Logger');
    });
  });

  describe('Dev View (Developer View)', () => {
    const devDiagram = `@startuml
participant User
participant WebUI
participant API
participant Cache
participant Database
participant Logger

User -> WebUI: Request data
WebUI -> API: GET /data

opt Cache Hit
    API -> Cache: Check cache
    Cache --> API: Data found
    API --> WebUI: 200 OK
    WebUI --> User: Display data
end

opt Cache Miss
    API -> Cache: Check cache
    Cache --> API: Not found
    API -> Database: Query data
    Database --> API: Data
    API -> Cache: Store cache
    API --> WebUI: 200 OK
    WebUI --> User: Display data
end

API -> Logger: Log request
@enduml`;

    it('should create Dev-friendly view focusing on backend', () => {
      const result = Polagram.init(devDiagram, 'plantuml')
        .focusParticipant(/API|Cache|Database/)
        .resolveFragment({ condition: 'Cache Miss' })
        .toPlantUML();
      
      const normalized = normalize(result);
      
      // Backend components preserved
      expect(normalized).toContain('API');
      expect(normalized).toContain('Cache');
      expect(normalized).toContain('Database');
      
      // WebUI is kept because API interacts with it
      expect(normalized).toContain('WebUI');
      // User removed (no direct interaction with focused participants)
      expect(normalized).not.toContain('User');
      
      // Cache miss flow preserved
      expect(normalized).toContain('API -> Database: Query data');
      expect(normalized).toContain('API -> Cache: Store cache');
    });

    it('should preserve internal logs for debugging', () => {
      const result = Polagram.init(devDiagram, 'plantuml')
        .focusParticipant(/API|Database|Logger/)
        .toPlantUML();
      
      const normalized = normalize(result);
      
      expect(normalized).toContain('Logger');
      expect(normalized).toContain('API -> Logger: Log request');
    });
  });

  describe('Security View', () => {
    const securityDiagram = `@startuml
participant Client
participant Gateway
participant Auth
participant API
participant Database
participant AuditLog

Client -> Gateway: Request with token
Gateway -> Auth: Validate token
Auth -> Database: Check token
Database --> Auth: Valid

alt Token Valid
    Auth --> Gateway: Authorized
    Gateway -> API: Forward request
    API -> Database: Process
    Database --> API: Result
    API --> Gateway: Response
    Gateway --> Client: 200 OK
    Gateway -> AuditLog: Log: Success
else Token Invalid
    Auth --> Gateway: Unauthorized
    Gateway --> Client: 401 Error
    Gateway -> AuditLog: Log: Failed auth
end
@enduml`;

    it('should create security-focused view', () => {
      const result = Polagram.init(securityDiagram, 'plantuml')
        .focusParticipant(/Gateway|Auth|AuditLog/)
        .toPlantUML();
      
      const normalized = normalize(result);
      
      expect(normalized).toContain('Gateway');
      expect(normalized).toContain('Auth');
      expect(normalized).toContain('AuditLog');
      // API and Database are kept because they interact with focused participants
      expect(normalized).toContain('API');
      expect(normalized).toContain('Database');
    });
  });

  describe('Cross-format scenarios', () => {
    it('should transform PlantUML and output as Mermaid for PM view', () => {
      const diagram = `@startuml
participant User
participant API
participant Logger
participant DB

User -> API: Request
API -> Logger: Log
Logger --> API: OK
API -> DB: Query
DB --> API: Data
API --> User: Response
@enduml`;

      const result = Polagram.init(diagram, 'plantuml')
        .removeParticipant('Logger')
        .toMermaid();
      
      const normalized = normalize(result);
      
      expect(normalized).toContain('sequenceDiagram');
      expect(normalized).not.toContain('Logger');
      expect(normalized).toContain('User->>API: Request');
      expect(normalized).toContain('API->>DB: Query');
    });
  });

  describe('Complex multi-step transformations', () => {
    const complexDiagram = `@startuml
participant Client
participant LoadBalancer
participant AppServer1
participant AppServer2
participant Cache
participant Database
participant Logger
participant Metrics

Client -> LoadBalancer: Request

alt Server 1
    LoadBalancer -> AppServer1: Route
    AppServer1 -> Metrics: Record
    AppServer1 -> Cache: Check
    
    opt Cache Hit
        Cache --> AppServer1: Data
        AppServer1 --> LoadBalancer: Response
    end
    
    opt Cache Miss
        AppServer1 -> Database: Query
        Database --> AppServer1: Data
        AppServer1 -> Cache: Store
        AppServer1 --> LoadBalancer: Response
    end
else Server 2
    LoadBalancer -> AppServer2: Route
    AppServer2 -> Metrics: Record
    AppServer2 -> Database: Query
    Database --> AppServer2: Data
    AppServer2 --> LoadBalancer: Response
end

LoadBalancer --> Client: Response
LoadBalancer -> Logger: Log request
@enduml`;

    it('should apply complex transformation pipeline', () => {
      const result = Polagram.init(complexDiagram, 'plantuml')
        .resolveFragment({ operator: 'alt', condition: 'Server 1' })
        .resolveFragment({ operator: 'opt', condition: 'Cache Miss' })
        .removeParticipant(/Logger|Metrics/)
        .focusParticipant(/AppServer1|Cache|Database/)
        .toPlantUML();
      
      const normalized = normalize(result);
      
      // Fragments resolved
      expect(normalized).not.toContain('alt Server 1');
      expect(normalized).not.toContain('opt Cache Miss');
      
      // Monitoring removed
      expect(normalized).not.toContain('Logger');
      expect(normalized).not.toContain('Metrics');
      
      // Core flow preserved
      expect(normalized).toContain('AppServer1');
      expect(normalized).toContain('Cache');
      expect(normalized).toContain('Database');
      expect(normalized).toContain('AppServer1 -> Database: Query');
    });
  });
});
