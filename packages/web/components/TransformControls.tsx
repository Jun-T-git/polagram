import { useState } from 'react';
import type { TransformOperation } from '../hooks/usePolagram';

interface TransformControlsProps {
  pipeline: TransformOperation[];
  pipelineCode: string;
  onAddTransform: (operation: 'focusParticipant' | 'removeParticipant' | 'resolveFragment', target: string) => void;
  onRemoveTransform: (index: number) => void;
  onToggleTransform: (index: number) => void;
  onToggleAll: () => void;
  getSuggestions: (operationType: 'participant' | 'fragment') => string[];
}

export default function TransformControls({ 
  pipeline, 
  pipelineCode,
  onAddTransform, 
  onRemoveTransform,
  onToggleTransform,
  onToggleAll,
  getSuggestions
}: TransformControlsProps) {
  const [selectedOperation, setSelectedOperation] = useState<'focusParticipant' | 'removeParticipant' | 'resolveFragment'>('focusParticipant');
  const [target, setTarget] = useState('');

  // Get suggestions based on selected operation
  const suggestions = getSuggestions(
    selectedOperation === 'focusParticipant' || selectedOperation === 'removeParticipant' 
      ? 'participant' 
      : 'fragment'
  );

  const getOperationLabel = (operation: string): string => {
    switch (operation) {
      case 'focusParticipant': return 'Focus Participant';
      case 'removeParticipant': return 'Remove Participant';
      case 'resolveFragment': return 'Resolve Fragment';
      default: return operation;
    }
  };

  const getPlaceholder = () => {
    if (selectedOperation === 'focusParticipant' || selectedOperation === 'removeParticipant') {
      return 'Participant name (e.g., Auth, API Server, Database)';
    } else {
      return 'Fragment label (e.g., Success, Cache Miss, Retry)';
    }
  };

  const getDescription = () => {
    switch (selectedOperation) {
      case 'focusParticipant':
        return 'Show only messages sent or received by the specified participant';
      case 'removeParticipant':
        return 'Remove the specified participant from the diagram';
      case 'resolveFragment':
        return 'Focus on the specified fragment and show only its contents (Unwrap/Resolve)';
    }
  };

  const handleApply = () => {
    if (target.trim()) {
      onAddTransform(selectedOperation, target.trim());
      setTarget(''); // Clear input after applying
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/40">
      <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-muted/20">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground">Transform Pipeline</h3>
        {pipeline.length > 0 && (() => {
          const hasEnabled = pipeline.some(op => op.enabled);
          return (
            <button 
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              onClick={onToggleAll}
              title={hasEnabled ? "Disable All" : "Enable All"}
            >
              {hasEnabled ? '👁️‍🗨️ Disable All' : '👁️ Enable All'}
            </button>
          );
        })()}
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Pipeline Display */}
        {pipeline.length > 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 font-mono text-xs text-muted-foreground overflow-x-auto">
              <code>{pipelineCode}</code>
            </div>
            <div className="space-y-2">
              {pipeline.map((op, index) => (
                <div 
                  key={index} 
                  className={`
                    group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                    ${!op.enabled 
                      ? 'bg-muted/10 border-border text-muted-foreground opacity-70' 
                      : 'bg-card border-border hover:border-primary/30 shadow-sm'}
                  `}
                >
                  <button 
                    className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
                    onClick={() => onToggleTransform(index)}
                    title={op.enabled ? "Disable Temporarily" : "Enable"}
                  >
                    {op.enabled ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-primary/80 w-5">{index + 1}.</span>
                    <span className="text-sm font-medium truncate">{getOperationLabel(op.operation)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground truncate max-w-[150px]">
                      "{op.target}"
                    </span>
                  </div>
                  <button 
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveTransform(index)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Add New Transformation */}
        <div className="p-6 rounded-xl border border-border bg-card/30 space-y-4 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Add Transform Lens</label>
            <select 
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value as 'focusParticipant' | 'removeParticipant' | 'resolveFragment')}
            >
              <option value="focusParticipant">Focus Participant</option>
              <option value="removeParticipant">Remove Participant</option>
              <option value="resolveFragment">Resolve Fragment</option>
            </select>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed pl-1 border-l-2 border-primary/20">{getDescription()}</p>
          
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
                list="suggestions"
              />
              <datalist id="suggestions">
                {suggestions.map((s, i) => <option key={i} value={s} />)}
              </datalist>
            </div>
            <button 
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm"
              onClick={handleApply}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
