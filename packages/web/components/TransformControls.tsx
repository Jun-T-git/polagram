import { TransformOperation } from '@/hooks/usePolagram';
import { Ban, Check, Eye, Minus, Plus, Settings2, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from './ui/sheet';

interface TransformControlsProps {
  pipeline: TransformOperation[];
  onAddTransform: (operation: 'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup', target: string, isRegex?: boolean) => void;
  onRemoveTransform: (index: number) => void;
  onToggleTransform: (index: number) => void;
  onToggleAll: () => void;
  getSuggestions: (operationType: 'participant' | 'fragment' | 'group' | 'message') => string[];
  view?: 'mobile' | 'desktop';
  className?: string;
}

export default function TransformControls({ 
  pipeline, 
  onAddTransform, 
  onRemoveTransform,
  onToggleTransform,
  onToggleAll,
  getSuggestions,
  view,
  className
}: TransformControlsProps) {
  const [selectedOperation, setSelectedOperation] = useState<'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup'>('focusParticipant');
  const [target, setTarget] = useState('');
  const [isRegex, setIsRegex] = useState(false);

  // Get suggestions ...
  const suggestions = getSuggestions(
    selectedOperation === 'focusParticipant' || selectedOperation === 'removeParticipant' 
      ? 'participant' 
      : selectedOperation === 'removeGroup'
        ? 'group'
        : selectedOperation === 'removeMessage'
          ? 'message'
          : 'fragment'
  );

  const handleApply = () => {
    if (target.trim()) {
      onAddTransform(selectedOperation, target.trim(), isRegex);
      setTarget('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  const ControlsContent = (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full">
      {/* Add New Transformation */}
      <div className="flex flex-col md:flex-row gap-2 flex-none w-full md:w-auto">
        <select 
          className="h-9 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-auto"
          value={selectedOperation}
          onChange={(e) => setSelectedOperation(e.target.value as 'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup')}
        >
          <option value="focusParticipant">Focus Participant</option>
          <option value="removeParticipant">Remove Participant</option>
          <option value="removeMessage">Remove Message</option>
          <option value="removeGroup">Remove Group</option>
          <option value="resolveFragment">Resolve Fragment</option>
        </select>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48 flex gap-1">
            <div className="relative flex-1">
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
                  {suggestions.map((s: string, i: number) => <option key={i} value={s} />)}
                </datalist>
            </div>
            <button
                className={cn(
                    "h-9 px-2.5 rounded-md border text-xs font-mono transition-colors",
                    isRegex 
                        ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsRegex(!isRegex)}
                title="Toggle Regex Matching"
            >
                .*
            </button>
          </div>
          
          <button 
            className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors shadow-sm whitespace-nowrap flex-none flex items-center gap-2"
            onClick={handleApply}
          >
            <Plus size={16} />
            <span className="hidden md:inline">Add Lens</span>
            <span className="md:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-6 bg-border mx-2 flex-none" />

      {/* Pipeline Display (Chips) */}
      <div className="flex-1 overflow-x-auto flex items-center gap-2 no-scrollbar w-full pb-1 md:pb-0 min-h-[2rem]">
        {pipeline.length === 0 ? (
          <span className="text-xs text-muted-foreground italic truncate">No active lenses applied</span>
        ) : (
          pipeline.map((op: TransformOperation, index: number) => {
            const Icon = op.operation === 'focusParticipant' ? Eye :
                         op.operation === 'resolveFragment' ? Check :
                         op.operation === 'removeParticipant' ? Ban : Minus;
            
            return (
              <div 
                key={index} 
                className={cn(
                  "flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-full border text-xs transition-all whitespace-nowrap flex-none h-7",
                  !op.enabled 
                    ? "bg-muted/30 border-border/60 text-muted-foreground opacity-60" 
                    : op.operation === 'focusParticipant' ? "bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300"
                    : op.operation === 'resolveFragment' ? "bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-300"
                    : "bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-300"
                )}
              >
                <button 
                  onClick={() => onToggleTransform(index)}
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                  title={op.enabled ? "Disable" : "Enable"}
                >
                  <Icon size={14} strokeWidth={2} className="shrink-0" />
                  <span className={cn("font-medium max-w-[120px] truncate", op.isRegex && "font-mono text-[11px]")}>
                    {op.isRegex ? `/${op.target}/` : op.target}
                  </span>
                </button>
                
                <div className="w-px h-3 bg-current opacity-20 mx-0.5" />

                <button 
                  className="text-current/50 hover:text-current transition-colors"
                  onClick={() => onRemoveTransform(index)}
                  title="Remove"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Global Actions */}
      {pipeline.length > 0 && (
        <button 
          className="flex-none text-xs font-medium px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors self-end md:self-auto"
          onClick={onToggleAll}
          title={pipeline.some((op: TransformOperation) => op.enabled) ? "Disable All" : "Enable All"}
        >
          {pipeline.some((op: TransformOperation) => op.enabled) ? 'Disable All' : 'Enable All'}
        </button>
      )}
    </div>
  );

  const MobileView = (
    <div className={cn("border-t border-border bg-background p-2", className)}>
      <Sheet>
        <SheetTrigger className="w-full flex items-center justify-between px-4 py-2 bg-secondary/20 hover:bg-secondary/40 rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Lenses assigned</span>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {pipeline.filter((p: TransformOperation) => p.enabled).length}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Edit</span>
        </SheetTrigger>
        <SheetContent side="bottom" hideClose className="h-[80vh] flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-border/40 shrink-0">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Settings2 size={20} />
                Lens Controls
              </h3>
              <SheetClose className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                <X size={24} />
              </SheetClose>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
              {ControlsContent}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  const DesktopView = (
    <div className={cn("hidden md:flex flex-col md:flex-row items-stretch md:items-center min-h-[3.5rem] h-auto bg-background border-border px-4 py-3 md:py-0 gap-3 md:gap-4 shadow-sm z-30", className)}>
      {ControlsContent}
    </div>
  );

  if (view === 'mobile') return MobileView;
  if (view === 'desktop') return (
    <div className={cn("flex flex-col md:flex-row items-stretch md:items-center min-h-[3.5rem] h-auto bg-background border-border px-4 py-3 md:py-0 gap-3 md:gap-4 shadow-sm z-30", className)}>
      {ControlsContent}
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        {MobileView}
      </div>
      <div className="hidden md:block">
        {DesktopView}
      </div>
    </>
  );
}
