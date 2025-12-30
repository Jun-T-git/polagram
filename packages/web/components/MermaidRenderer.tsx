'use client';

import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

interface MermaidRendererProps {
  code: string;
}

// Initialize mermaid with custom theme
mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#8a5cf6',
    primaryTextColor: '#f3f4f6',
    primaryBorderColor: '#8a5cf6',
    lineColor: '#8a5cf6',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    secondBkg: '#0f172a',
    textColor: '#f3f4f6',
    fontSize: '16px',
  },
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: true,
    useMaxWidth: true,
  },
});

export default function MermaidRenderer({ code }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    const renderId = `mermaid-${Date.now()}-${renderIdRef.current++}`;
    
    const renderDiagram = async () => {
      try {
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Render the diagram
        const { svg } = await mermaid.render(renderId, code);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        // console.error('Mermaid rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6 text-destructive bg-destructive/5 rounded-lg border border-destructive/20">
              <p class="font-semibold mb-2">Failed to render diagram</p>
              <pre class="text-xs font-mono whitespace-pre-wrap break-all">${error instanceof Error ? error.message : 'Unknown error'}</pre>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto" 
    />
  );
}
