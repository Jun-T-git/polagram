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
    participant Client as Frontend
    participant API as API Server
    participant Auth as Auth Service
    participant DB as Database
    participant Cache as Cache
    
    Note over Client,Cache: User Info Retrieval API
    
    Client->>API: GET /api/users/123
    API->>Auth: Verify Token
    
    alt Auth Success
        Auth-->>API: OK
        API->>Cache: Get User Info
        
        alt Cache Hit
            Cache-->>API: User Info
            API-->>Client: 200 OK
        else Cache Miss
            Cache-->>API: None
            API->>DB: SELECT * FROM users WHERE id=123
            DB-->>API: User Info
            API->>Cache: Save to Cache (TTL: 5min)
            API-->>Client: 200 OK
        end
    else Auth Failed
        Auth--xAPI: Invalid Token
        API--xClient: 401 Unauthorized
    end
    
    Note over Client,Cache: You can check specific processes with Focus
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
