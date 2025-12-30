'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeEditor from '../../components/CodeEditor';
import SequenceDiagram from '../../components/SequenceDiagram';
import Tabs from '../../components/Tabs';
import TransformControls from '../../components/TransformControls';
import { usePolagram } from '../../hooks/usePolagram';

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
  const [activeTab, setActiveTab] = useState('polagram.yml');
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <header className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Image src="/polagram-logo.png" alt="Polagram" width={24} height={24} />
            <span>Polagram Viewer</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Interactive Sequence Diagram Viewer</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div 
          className="w-full bg-card/50"
          style={{ height: workspaceHeight }}
        >
          <PanelGroup direction="horizontal" className="h-full w-full">
            <Panel defaultSize={40} minSize={20} className="flex flex-col border-r border-border/50">
              <div className="h-full flex flex-col bg-muted/10">
                <Tabs 
                  tabs={['polagram.yml', 'diagram.mmd']} 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                />
                <div className="flex-1 relative overflow-hidden">
                  {activeTab === 'diagram.mmd' ? (
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

            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors cursor-col-resize z-10" />

            <Panel defaultSize={60} minSize={20} className="flex flex-col">
              <div className="h-full flex flex-col bg-background">
                <div className="px-4 py-2 border-b border-border bg-muted/10">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sequence Diagram</h2>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-white/50 dark:bg-neutral-900/50">
                  <SequenceDiagram code={transformedCode} error={error} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
        
        {/* Workspace Resizer */}
        <div 
            className="h-1.5 w-full bg-border hover:bg-primary/50 cursor-row-resize transition-colors z-20 flex items-center justify-center group" 
            onMouseDown={startResizing}
        >
            <div className="w-12 h-1 rounded-full bg-muted-foreground/20 group-hover:bg-primary/80 transition-colors" />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 border-t border-destructive/20 px-4 py-2 text-xs text-destructive flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        {/* Control Bar Footer */}
        <div className="flex-none bg-background">
          <TransformControls 
            pipeline={pipeline}
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
