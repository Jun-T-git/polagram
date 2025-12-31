import { TransformOperation } from '@/hooks/usePolagram';
import { useState } from 'react';

interface TransformControlsProps {
  pipeline: TransformOperation[];
  onAddTransform: (operation: 'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup', target: string) => void;
  onRemoveTransform: (index: number) => void;
  onToggleTransform: (index: number) => void;
  onToggleAll: () => void;
  getSuggestions: (operationType: 'participant' | 'fragment' | 'group') => string[];
}

export default function TransformControls({ 
  pipeline, 
  onAddTransform, 
  onRemoveTransform,
  onToggleTransform,
  onToggleAll,
  getSuggestions
}: TransformControlsProps) {
  const [selectedOperation, setSelectedOperation] = useState<'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup'>('focusParticipant');
  const [target, setTarget] = useState('');

  // Get suggestions based on selected operation
  const suggestions = getSuggestions(
    selectedOperation === 'focusParticipant' || selectedOperation === 'removeParticipant' 
      ? 'participant' 
      : selectedOperation === 'removeGroup'
        ? 'group'
        : 'fragment'
  );

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
    <div className="flex flex-row items-center h-14 bg-background border-t border-border px-4 gap-4 shadow-sm z-30">
      {/* Add New Transformation (Compact) */}
      <div className="flex items-center gap-2 flex-none">
        <select 
          className="h-9 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={selectedOperation}
          onChange={(e) => setSelectedOperation(e.target.value as 'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup')}
        >
          <option value="focusParticipant">Focus Participant</option>
          <option value="removeParticipant">Remove Participant</option>
          <option value="removeMessage">Remove Message</option>
          <option value="removeGroup">Remove Group</option>
          <option value="resolveFragment">Resolve Fragment</option>
        </select>
        
        <div className="relative w-48">
          <input
            type="text"
            className="w-full h-9 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedOperation === 'resolveFragment' ? "Fragment..." : 
              selectedOperation === 'removeMessage' ? "Message text..." : 
              selectedOperation === 'removeGroup' ? "Group name..." :
              "Participant..."
            }
            list="suggestions"
          />
          <datalist id="suggestions">
            {suggestions.map((s, i) => <option key={i} value={s} />)}
          </datalist>
        </div>
        
        <button 
          className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors shadow-sm whitespace-nowrap"
          onClick={handleApply}
        >
          Add Lens
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-2 flex-none" />

      {/* Pipeline Display (Chips) */}
      <div className="flex-1 overflow-x-auto flex items-center gap-2 no-scrollbar">
        {pipeline.length === 0 ? (
          <span className="text-xs text-muted-foreground italic truncate">No active lenses applied</span>
        ) : (
          pipeline.map((op, index) => (
            <div 
              key={index} 
              className={`
                group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all whitespace-nowrap
                ${!op.enabled 
                  ? 'bg-muted/10 border-border text-muted-foreground opacity-70' 
                  : 'bg-primary/5 border-primary/20 text-foreground shadow-sm'}
              `}
            >
              <button 
                className="hover:text-primary transition-colors"
                onClick={() => onToggleTransform(index)}
                title={op.enabled ? "Disable" : "Enable"}
              >
                {op.enabled ? '●' : '○'}
              </button>
              
              <span className="opacity-75">{index + 1}.</span>
              <span className="max-w-[100px] truncate">
                {op.operation === 'focusParticipant' ? 'Focus' : 
                 op.operation === 'removeParticipant' ? 'Remove' : 
                 op.operation === 'removeMessage' ? 'Rm Msg' :
                 op.operation === 'removeGroup' ? 'Rm Grp' :
                 op.operation === 'resolveFragment' ? 'Resolve' : op.operation}
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-background/50 border border-border/50 truncate max-w-[80px]">
                {op.target}
              </span>
              
              <button 
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors opacity-50 group-hover:opacity-100"
                onClick={() => onRemoveTransform(index)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Global Actions */}
      {pipeline.length > 0 && (
        <button 
          className="flex-none text-xs font-medium px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
          onClick={onToggleAll}
          title={pipeline.some(op => op.enabled) ? "Disable All" : "Enable All"}
        >
          {pipeline.some(op => op.enabled) ? 'Disable All' : 'Enable All'}
        </button>
      )}
    </div>
  );
}
