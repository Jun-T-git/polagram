import { Polagram } from './src/api';

const code = `sequenceDiagram
    participant Client as フロントエンド
    participant API as APIサーバー
    Client-\u003e\u003eAPI: リクエスト
`;

const builder = Polagram.init(code);
const ast = builder.toAST();

console.log('Participants:');
ast.participants.forEach(p =\u003e {
  console.log(`  ID: ${p.id}, Name: ${p.name}`);
});
