import { describe, expect, it } from 'vitest';
import { Polagram } from '../../src/api';

describe('PlantUML Bug Reproduction', () => {
  it('should handle complex note syntax correctly', () => {
    const diagram = `@startuml
participant client

note right
    URL
    (例: https://example.com)
end note

note right of client
    セキュリティ: originチェック
    - チャレンジ認証完了: Proxyのorigin
end note
@enduml`;

    expect(() => {
        const result = Polagram.init(diagram, 'plantuml').toPlantUML();
        // Just checking if it parses without error for now, as "壊れます" likely means crash or invalid output.
        // If it returns, we can inspect the result.
        console.log('Result:', result);
    }).not.toThrow();
  });
});
