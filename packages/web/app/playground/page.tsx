'use client';

import { usePolagram } from '@/hooks/usePolagram';
import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeEditor from '../../components/CodeEditor';
import SequenceDiagram from '../../components/SequenceDiagram';
import Tabs from '../../components/Tabs';
import TransformControls from '../../components/TransformControls';

const DEFAULT_MERMAID = `sequenceDiagram
    participant Client as Frontend
    participant API as API Server
    participant Auth as Auth Service
    participant DB as Database
    participant Cache as Cache
    
    Note over Client,Cache: User Info Retrieval API
    
    Client->>API: GET /api/users/123
    API->>Auth: Verify Token
    
    alt Success: Auth Success
        Auth-->>API: OK
        API->>Cache: Get User Info
        
        alt Success: Cache Hit
            Cache-->>API: User Info
            API-->>Client: 200 OK
        else Failure: Cache Miss
            Cache-->>API: None
            API->>DB: SELECT * FROM users WHERE id=123
            DB-->>API: User Info
            API->>Cache: Save to Cache (TTL: 5min)
            API-->>Client: 200 OK
        end
    else Failure: Auth Failed
        Auth--xAPI: Invalid Token
        API--xClient: 401 Unauthorized
    end
    
    Note over Client,Cache: You can check specific processes with Focus
`;

export default function ViewerPage() {
  const [code, setCode] = useState(DEFAULT_MERMAID);
  const [activeTab, setActiveTab] = useState('polagram.yml');
  const [mobileTab, setMobileTab] = useState('Preview');

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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-foreground">
      <header className="px-4 py-3 md:px-6 md:py-4 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>Polagram Viewer</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Interactive Sequence Diagram Viewer</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Controls (Top) */}
        <div className="hidden md:block flex-none z-30">
          <TransformControls 
            pipeline={pipeline}
            onAddTransform={addTransform}
            onRemoveTransform={removeTransform}
            onToggleTransform={toggleTransform}
            onToggleAll={toggleAll}
            getSuggestions={getSuggestions}
            view="desktop"
            className="border-b"
          />
        </div>

        <div className="w-full bg-card/50 flex-1 flex flex-col min-h-0">
          {isMobile ? (
            <div className="flex flex-col h-full">
              <Tabs 
                tabs={['diagram.mmd', 'polagram.yml', 'Preview']} 
                activeTab={mobileTab} 
                onTabChange={setMobileTab} 
              />
              <div className="flex-1 relative overflow-hidden bg-muted/10">
                {mobileTab === 'diagram.mmd' && (
                  <CodeEditor 
                    value={code} 
                    onChange={setCode} 
                    error={error} 
                    placeholder="Enter sequence diagram code (Mermaid)..."
                  />
                )}
                {mobileTab === 'polagram.yml' && (
                  <CodeEditor 
                    value={lensYaml} 
                    onChange={updateLensYaml} 
                    error={null} 
                    placeholder="Enter Lens configuration (YAML)..."
                  />
                )}
                {mobileTab === 'Preview' && (
                  <div className="h-full flex flex-col bg-background">
                     <div className="flex-1 overflow-auto p-4 bg-white/50 dark:bg-neutral-900/50">
                      <SequenceDiagram code={transformedCode} error={error} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <PanelGroup direction="horizontal" className="h-full w-full">
              <Panel defaultSize={40} minSize={20} className="flex flex-col">
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

              <PanelResizeHandle className="w-px bg-border hover:bg-primary transition-colors z-10" />

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
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 border-t border-destructive/20 px-4 py-2 text-xs text-destructive flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        {/* Control Bar Footer (Mobile Only) */}
        <div className="md:hidden flex-none bg-background">
          <TransformControls 
            pipeline={pipeline}
            onAddTransform={addTransform}
            onRemoveTransform={removeTransform}
            onToggleTransform={toggleTransform}
            onToggleAll={toggleAll}
            getSuggestions={getSuggestions}
            view="mobile"
          />
        </div>
      </main>
    </div>
  );
}
