import MermaidRenderer from './MermaidRenderer';
import styles from './SequenceDiagram.module.css';

interface SequenceDiagramProps {
  code: string;
  error: string | null;
}

export default function SequenceDiagram({ code, error }: SequenceDiagramProps) {
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>Failed to render diagram</p>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  if (!code.trim()) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <p>Enter Mermaid code to see the diagram</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <MermaidRenderer code={code} />
    </div>
  );
}
