import { useState } from 'react';

interface CodeDrawerProps {
  sourceCode: string;
  transformedCode: string;
}

export default function CodeDrawer({
  sourceCode,
  transformedCode,
}: CodeDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'source' | 'transformed'>(
    'source',
  );

  return (
    <div className="code-drawer">
      <button
        type="button"
        className="code-drawer-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>コードを表示</span>
      </button>

      {isOpen && (
        <div className="code-drawer-content">
          <div className="code-drawer-tabs">
            <button
              type="button"
              className={`code-drawer-tab ${activeTab === 'source' ? 'active' : ''}`}
              onClick={() => setActiveTab('source')}
            >
              Source
            </button>
            <button
              type="button"
              className={`code-drawer-tab ${activeTab === 'transformed' ? 'active' : ''}`}
              onClick={() => setActiveTab('transformed')}
            >
              Transformed
            </button>
          </div>
          <pre>{activeTab === 'source' ? sourceCode : transformedCode}</pre>
        </div>
      )}
    </div>
  );
}
