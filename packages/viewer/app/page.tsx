'use client';

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeEditor from './components/CodeEditor';
import SequenceDiagram from './components/SequenceDiagram';
import Tabs from './components/Tabs';
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
  const [activeTab, setActiveTab] = useState('Mermaid Code');
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
        <PanelGroup direction="horizontal" style={{ height: '100%', width: '100%' }}>
          <Panel defaultSize={40} minSize={20} className={styles.panel}>
            <PanelGroup direction="vertical" style={{ height: '100%', width: '100%' }}>
              <Panel defaultSize={70} minSize={20} className={styles.panel}>
                <div className={styles.editorPanel}>
                  <Tabs 
                    tabs={['Mermaid Code', 'Lens Config (YAML)']} 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                  />
                  <div className={styles.editorContent}>
                    {activeTab === 'Mermaid Code' ? (
                      <CodeEditor value={code} onChange={setCode} error={error} />
                    ) : (
                      <CodeEditor value={lensYaml} onChange={updateLensYaml} error={null} />
                    )}
                  </div>
                </div>
              </Panel>
              
<PanelResizeHandle className={styles.resizeHandleHorizontal} />

              <Panel defaultSize={30} minSize={10} className={styles.panel}>
                <TransformControls 
                  pipeline={pipeline}
                  pipelineCode={getPipelineCode()}
                  onAddTransform={addTransform}
                  onRemoveTransform={removeTransform}
                  onToggleTransform={toggleTransform}
                  onToggleAll={toggleAll}
                  getSuggestions={getSuggestions}
                />
              </Panel>
            </PanelGroup>
          </Panel>

<PanelResizeHandle className={styles.resizeHandleVertical} />

          <Panel defaultSize={60} minSize={20} className={styles.panel}>
            <div className={styles.diagramPanel}>
              <div className={styles.panelHeader}>
                <h2>Sequence Diagram</h2>
              </div>
              <SequenceDiagram code={transformedCode} error={error} />
            </div>
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}
