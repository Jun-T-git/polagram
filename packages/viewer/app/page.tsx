'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('sample-lens.yaml');
  const [workspaceHeight, setWorkspaceHeight] = useState(600);
  const isResizingRef = useRef(false);

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

  const startResizing = useCallback(() => {
    isResizingRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingRef.current) {
      // Allow resizing by calculating distance from top, adjusting for header approx height (80-90px)
      // or easier: just use the mouse Y position relative to the main container.
      // But Since main is at the top, e.clientY - headerHeight is a good approx.
      // Let's assume header is ~85px. 
      const newHeight = e.clientY - 85; 
      if (newHeight > 200) {
         setWorkspaceHeight(newHeight);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

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
        <div className={styles.workspace} style={{ height: workspaceHeight }}>
          <PanelGroup direction="horizontal" style={{ height: '100%', width: '100%' }}>
            <Panel defaultSize={40} minSize={20} className={styles.panel}>
              <div className={styles.editorPanel}>
                <Tabs 
                  tabs={['sample-lens.yaml', 'sequence-source.mmd']} 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                />
                <div className={styles.editorContent}>
                  {activeTab === 'sequence-source.mmd' ? (
                    <CodeEditor 
                      value={code} 
                      onChange={setCode} 
                      error={error} 
                      placeholder="Enter sequence diagram code (Mermaid)..."
                    />
                  ) : (
                    <CodeEditor 
                      value={lensYaml} 
                      onChange={updateLensYaml} 
                      error={null} 
                      placeholder="Enter Lens configuration (YAML)..."
                    />
                  )}
                </div>
              </div>
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
        </div>
        
        <div className={styles.workspaceResizer} onMouseDown={startResizing} />

        <div className={styles.pipelinePanel}>
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
      </main>
    </div>
  );
}
