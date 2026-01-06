import { useEffect, useState } from 'react';
import type { PreviewCase, PreviewData } from '../types';
import CodeDrawer from './components/CodeDrawer';
import DiagramView from './components/DiagramView';
import Header from './components/Header';
import LayerToggle from './components/LayerToggle';
import Sidebar from './components/Sidebar';

export default function App() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [selectedCase, setSelectedCase] = useState<PreviewCase | null>(null);
  const [enabledLayers, setEnabledLayers] = useState<Set<number>>(new Set());
  const [isDark, setIsDark] = useState(true);

  // Load preview data
  useEffect(() => {
    fetch(`./preview-data.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((json: PreviewData) => {
        setData(json);
        // Select first case by default
        if (json.cases.length > 0) {
          const firstCase = json.cases[0];
          setSelectedCase(firstCase);
          setEnabledLayers(new Set(firstCase.lens.layers.map((_, i) => i)));
          // Update URL
          window.location.hash = `#/${firstCase.id}`;
        }
      })
      .catch(console.error);
  }, []);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (!data) return;
      const hash = window.location.hash.slice(2); // Remove "#/"
      const found = data.cases.find((c) => c.id === hash);
      if (found) {
        setSelectedCase(found);
        setEnabledLayers(new Set(found.lens.layers.map((_, i) => i)));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [data]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleSelectCase = (previewCase: PreviewCase) => {
    setSelectedCase(previewCase);
    setEnabledLayers(new Set(previewCase.lens.layers.map((_, i) => i)));
    window.location.hash = `#/${previewCase.id}`;
  };

  const handleToggleLayer = (index: number) => {
    setEnabledLayers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!data) {
    return (
      <div className="loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />
      <div className="main">
        <Sidebar
          cases={data.cases}
          selectedId={selectedCase?.id ?? null}
          onSelect={handleSelectCase}
        />
        <div className="content">
          {selectedCase && (
            <>
              <div className="content-header">
                <span className="breadcrumb">{selectedCase.id}</span>
                <LayerToggle
                  layers={selectedCase.lens.layers}
                  enabledLayers={enabledLayers}
                  onToggle={handleToggleLayer}
                />
              </div>
              <DiagramView
                sourceCode={selectedCase.sourceCode}
                lens={selectedCase.lens}
                enabledLayers={enabledLayers}
              />
              <CodeDrawer
                sourceCode={selectedCase.sourceCode}
                transformedCode={selectedCase.transformedCode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
