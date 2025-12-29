'use client';

import { useState } from 'react';
import { usePolagram } from '../../hooks/usePolagram';
import { cn } from '../../lib/utils';
import SequenceDiagram from '../SequenceDiagram';
import { Button } from '../ui/button';

const COMPLEX_CODE = `sequenceDiagram
    participant User
    participant Web
    participant API
    participant DB
    participant Payment
    
    User->>Web: Order Item
    Web->>API: POST /order
    API->>API: Log: Start processing
    
    API->>DB: Get User Info
    DB-->>API: User Data
    
    API->>Payment: Charge(100)
    
    alt Payment Success
        Payment-->>API: OK
        API->>DB: Save Order
        API->>API: Log: Order Saved
        API-->>Web: Success
    else Payment Failed
        Payment-->>API: Error
        API->>API: Log: Payment Failed
        API-->>Web: Error
    end`;

const PRESETS = {
  original: '',
  pm: `# polagram.yml (Lens Definition)
name: PM View
layers:
  # 1. Remove internal logs to reduce noise
  - action: remove
    selector:
      kind: message
      text: 
        pattern: '^Log:'

  # 2. Show only the happy path
  - action: resolve
    selector:
      kind: fragment
      condition: 'Payment Success'

  # 3. Focus on high-level user journey
  - action: focus
    selector:
      kind: participant
      name:
        pattern: 'User|Web|API|Payment'`,
        
  dev: `# polagram.yml (Lens Definition)
name: Dev View
layers:
  # Focus strictly on backend services
  - action: focus
    selector:
      kind: participant
      name:
        pattern: 'API|Payment|DB'`
};

export function FocusDemo() {
  const { transformedCode, error, updateLensYaml, pipeline } = usePolagram(COMPLEX_CODE);
  const [activeTab, setActiveTab] = useState<'preview' | 'config'>('preview');
  
  const handlePreset = (preset: keyof typeof PRESETS) => {
    updateLensYaml(PRESETS[preset]);
  };

  const currentMode = pipeline.length === 0 ? 'original' 
    : pipeline.some(p => p.operation === 'resolveFragment') ? 'pm' : 'dev';

  const currentYaml = currentMode === 'original' ? '# No configuration (Original View)' : PRESETS[currentMode];

  return (
    <div className="my-8 not-prose border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* 1. Header Section: Title & View Controls */}
      <div className="border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Live Demo: Context Switching</h3>
          <p className="text-sm text-neutral-500">See how the same diagram looks to different team members.</p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <Button 
            size="sm" 
            variant={currentMode === 'original' ? 'primary' : 'secondary'}
            onClick={() => handlePreset('original')}
          >
            Original
          </Button>
          <Button 
            size="sm" 
            variant={currentMode === 'pm' ? 'primary' : 'secondary'}
            onClick={() => handlePreset('pm')}
          >
            PM View
          </Button>
          <Button 
            size="sm" 
            variant={currentMode === 'dev' ? 'primary' : 'secondary'}
            onClick={() => handlePreset('dev')}
          >
            Dev View
          </Button>
        </div>
      </div>

      {/* 2. Context Explanation Bar */}
      <div className="px-6 py-4 border-b border-border/40 bg-background/50 text-sm grid md:grid-cols-[auto_1fr] gap-x-8 gap-y-2 items-start">
         <div className="flex items-center gap-2 text-foreground font-medium shrink-0">
            {currentMode === 'original' && '⚡️ Master Diagram'}
            {currentMode === 'pm' && '👀 Product Manager View'}
            {currentMode === 'dev' && '🔧 Backend Dev View'}
         </div>
         <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
            {currentMode === 'original' && (
              <span>The raw, single source of truth containing all logs, errors, and details.</span>
            )}
            {currentMode === 'pm' && (
              <>
                 <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>Removed Logs</span>
                 <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>Happy Path Only</span>
              </>
            )}
            {currentMode === 'dev' && (
               <>
                 <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Focus Backend</span>
                 <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>Keep Logs</span>
               </>
            )}
         </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex items-center px-4 border-b border-border/40 bg-muted/10">
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            "py-3 px-4 text-xs font-medium transition-colors border-b-2 translate-y-[1px]",
            activeTab === 'preview' 
              ? "border-primary text-foreground" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={cn(
            "py-3 px-4 text-xs font-medium transition-colors border-b-2 translate-y-[1px]",
            activeTab === 'config' 
              ? "border-primary text-foreground" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          polagram.yml
        </button>
      </div>

      {/* 4. Content Area */}
      <div className="relative min-h-[400px] bg-neutral-900/10">
         {activeTab === 'preview' ? (
            <>
              <div className="bg-neutral-900/50 absolute inset-0">
                 <SequenceDiagram code={transformedCode} error={error} />
              </div>
              {/* Active Filters Indicators */}
              <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none z-10">
                {currentMode === 'original' && (
                    <span className="bg-neutral-500/20 text-neutral-400 border border-neutral-500/30 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">Raw View</span>
                )}
                {currentMode === 'pm' && (
                  <>
                    <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">No Logs</span>
                    <span className="bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">Happy Path</span>
                  </>
                )}
                {currentMode === 'dev' && (
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">Backend Focus</span>
                )}
              </div>
            </>
         ) : (
            <div className="bg-[#1e1e1e] absolute inset-0 overflow-auto p-4">
               <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                 {currentYaml}
               </pre>
            </div>
         )}
      </div>
    </div>
  );
}
