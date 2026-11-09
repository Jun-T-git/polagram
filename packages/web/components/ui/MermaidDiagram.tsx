'use client';

import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState({ chart: '', svg: '', error: '' });
  const svg = result.chart === chart ? result.svg : '';
  const error = result.chart === chart ? result.error : '';

  useEffect(() => {
    let cancelled = false;
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Initialize mermaid with dark theme
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          suppressErrorRendering: true,
          themeVariables: {
            darkMode: true,
            background: 'transparent',
            primaryColor: '#6366f1',
            primaryTextColor: '#e5e7eb',
            primaryBorderColor: '#4f46e5',
            lineColor: '#6b7280',
            secondaryColor: '#8b5cf6',
            tertiaryColor: '#10b981',
            fontSize: '12px',
          },
        });

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (!cancelled) setResult({ chart, svg: renderedSvg, error: '' });
      } catch (err) {
        if (!cancelled) {
          setResult({ chart, svg: '', error: err instanceof Error ? err.message : 'Failed to render diagram' });
        }
      }
    };

    void renderDiagram();
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <>
      {error && <div role="alert" className={`text-red-400 text-xs p-4 bg-red-500/10 rounded border border-red-500/20 ${className}`}>Error: {error}</div>}
      <div ref={containerRef} className={`mermaid-container ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />
    </>
  );
}
