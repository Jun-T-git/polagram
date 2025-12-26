import { useState } from 'react';
import type { TransformOperation } from '../hooks/usePolagram';
import styles from './TransformControls.module.css';

interface TransformControlsProps {
  pipeline: TransformOperation[];
  pipelineCode: string;
  onAddTransform: (operation: 'focus' | 'unwrap' | 'remove', target: string) => void;
  onRemoveTransform: (index: number) => void;
  onToggleTransform: (index: number) => void;
  onToggleAll: () => void;
}

export default function TransformControls({ 
  pipeline, 
  pipelineCode,
  onAddTransform, 
  onRemoveTransform,
  onToggleTransform,
  onToggleAll 
}: TransformControlsProps) {
  const [selectedOperation, setSelectedOperation] = useState<'focus' | 'unwrap' | 'remove'>('focus');
  const [target, setTarget] = useState('');

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
              title={hasEnabled ? "全て無効化" : "全て有効化"}
            >
              {hasEnabled ? '👁️‍🗨️ 全て無効化' : '👁️ 全て有効化'}
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
                  title={op.enabled ? "一時的に無効化" : "有効化"}
                >
                  {op.enabled ? '👁️' : '👁️‍🗨️'}
                </button>
                <span className={styles.pipelineOperation}>
                  {index + 1}. {op.operation}
                </span>
                <span className={styles.pipelineTarget}>"{op.target}"</span>
                <button 
                  className={styles.removeButton}
                  onClick={() => onRemoveTransform(index)}
                  title="削除"
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
        <div className={styles.operationButtons}>
          <button
            className={`${styles.operationButton} ${selectedOperation === 'focus' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('focus')}
          >
            🎯 Focus
          </button>
          <button
            className={`${styles.operationButton} ${selectedOperation === 'unwrap' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('unwrap')}
          >
            📦 Unwrap
          </button>
          <button
            className={`${styles.operationButton} ${selectedOperation === 'remove' ? styles.active : ''}`}
            onClick={() => setSelectedOperation('remove')}
          >
            🗑️ Remove
          </button>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="text"
            className={styles.input}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Enter ${selectedOperation === 'focus' ? 'participant name' : 'target'}`}
          />
          <button className={styles.applyButton} onClick={handleApply}>
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
