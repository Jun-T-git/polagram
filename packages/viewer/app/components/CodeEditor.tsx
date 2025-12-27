import { type ChangeEvent } from 'react';
import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  placeholder?: string;
}

export default function CodeEditor({ value, onChange, error, placeholder }: CodeEditorProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.container}>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={handleChange}
        spellCheck={false}
        placeholder={placeholder || "Enter Mermaid sequence diagram code..."}
      />
      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
