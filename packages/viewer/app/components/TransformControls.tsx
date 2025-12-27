import { useState } from 'react';
import type { TransformOperation } from '../hooks/usePolagram';
import styles from './TransformControls.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Transform Pipeline</h3>
        {pipeline.length > 0 && (() => {
          const hasEnabled = pipeline.some(op => op.enabled);
          return (
            <button 
              className={styles.toggleAllButton} 
              onClick={onToggleAll}
              title={hasEnabled ? "Disable All" : "Enable All"}
            >
              {hasEnabled ? '👁️‍🗨️ Disable All' : '👁️ Enable All'}
            </button>
          );
        })()}
      </div>

      {/* Pipeline Display */}
      {pipeline.length > 0 && (
        <div className={styles.pipelineDisplay}>
          <div className={styles.pipelineCode}>
            <code>{pipelineCode}</code>
          </div>
          <div className={styles.pipelineList}>
            {pipeline.map((op, index) => (
              <div 
                key={index} 
                className={`${styles.pipelineItem} ${!op.enabled ? styles.disabled : ''}`}
              >
                <button 
                  className={styles.toggleButton}
                  onClick={() => onToggleTransform(index)}
                  title={op.enabled ? "Disable Temporarily" : "Enable"}
                >
                  {op.enabled ? '👁️' : '👁️‍🗨️'}
                </button>
                <span className={styles.pipelineOperation}>
                  {index + 1}. {getOperationLabel(op.operation)}
                </span>
                <span className={styles.pipelineTarget}>"{op.target}"</span>
                <button 
                  className={styles.removeButton}
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
      <div className={styles.controls}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Select Operation</label>
          <select 
            className={styles.select}
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value as 'focusParticipant' | 'removeParticipant' | 'resolveFragment')}
          >
            <option value="focusParticipant">Focus Participant</option>
            <option value="removeParticipant">Remove Participant</option>
            <option value="resolveFragment">Resolve Fragment</option>
          </select>
          
          <p className={styles.description}>{getDescription()}</p>
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholder()}
              list="suggestions"
            />
            <datalist id="suggestions">
              {suggestions.map((s, i) => <option key={i} value={s} />)}
            </datalist>
            <button className={styles.applyButton} onClick={handleApply}>
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
