'use client';

import { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import SequenceDiagram from './components/SequenceDiagram';
import TransformControls from './components/TransformControls';
import { usePolagram } from './hooks/usePolagram';
import styles from './page.module.css';

const DEFAULT_MERMAID = `sequenceDiagram
    participant Client as フロントエンド
    participant API as APIサーバー
    participant Auth as 認証
    participant DB as データベース
    participant Cache as キャッシュ
    
    Note over Client,Cache: ユーザー情報取得API
    
    Client->>API: GET /api/users/123
    API->>Auth: トークン検証
    
    alt 認証成功
        Auth-->>API: OK
        API->>Cache: ユーザー情報取得
        
        alt キャッシュヒット
            Cache-->>API: ユーザー情報
            API-->>Client: 200 OK
        else キャッシュミス
            Cache-->>API: なし
            API->>DB: SELECT * FROM users WHERE id=123
            DB-->>API: ユーザー情報
            API->>Cache: キャッシュ保存 (TTL: 5分)
            API-->>Client: 200 OK
        end
    else 認証失敗
        Auth--xAPI: 無効なトークン
        API--xClient: 401 Unauthorized
    end
    
    Note over Client,Cache: Focusで特定の処理だけ確認できます
`;

export default function ViewerPage() {
  const [code, setCode] = useState(DEFAULT_MERMAID);
  const { 
    transformedCode, 
    error, 
    pipeline,
    lensYaml,
    updateLensYaml,
    addTransform,
    removeTransform,
    toggleTransform,
    toggleAll,
    getPipelineCode,
    getSuggestions
  } = usePolagram(code);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.logo}>🎭</span>
          Polagram Viewer
        </h1>
        <p className={styles.subtitle}>Interactive Sequence Diagram Viewer</p>
      </header>

      <main className={styles.main}>
        <div className={styles.editorPanel}>
          <div className={styles.panelHeader}>
            <h2>Mermaid Code</h2>
          </div>
          <CodeEditor value={code} onChange={setCode} error={error} />
          
          <div className={styles.panelHeader} style={{ marginTop: '20px' }}>
             <h2>Lens Configuration (YAML)</h2>
          </div>
          <CodeEditor value={lensYaml} onChange={updateLensYaml} error={null} />

          <TransformControls 
            pipeline={pipeline}
            pipelineCode={getPipelineCode()}
            onAddTransform={addTransform}
            onRemoveTransform={removeTransform}
            onToggleTransform={toggleTransform}
            onToggleAll={toggleAll}
            getSuggestions={getSuggestions}
          />
        </div>

        <div className={styles.diagramPanel}>
          <div className={styles.panelHeader}>
            <h2>Sequence Diagram</h2>
          </div>
          <SequenceDiagram code={transformedCode} error={error} />
        </div>
      </main>
    </div>
  );
}
