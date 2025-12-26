import { Polagram } from './src/api';

const code = `sequenceDiagram
    participant Client as フロントエンド
    participant API as APIサーバー
    participant Auth as 認証
    
    Client->>API: リクエスト
    API->>Auth: トークン検証
    Auth-->>API: OK
    API-->>Client: レスポンス
`;

console.log('=== Test 1: focusParticipant with ID ===');
const result1 = Polagram.init(code).focusParticipant('Client').toMermaid();
console.log(result1);

console.log('\n=== Test 2: focusParticipant with Japanese name ===');
const result2 = Polagram.init(code).focusParticipant('フロントエンド').toMermaid();
console.log(result2);

console.log('\n=== Test 3: hideParticipant with Japanese name ===');
const result3 = Polagram.init(code).hideParticipant('認証').toMermaid();
console.log(result3);
