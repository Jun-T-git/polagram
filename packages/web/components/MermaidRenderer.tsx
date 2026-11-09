'use client';

import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

interface MermaidRendererProps {
  code: string;
}

// Initialize mermaid with custom theme
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
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
    let cancelled = false;
    if (!containerRef.current) return;
    containerRef.current.replaceChildren();
    if (!code) return;

    const renderId = `mermaid-${Date.now()}-${renderIdRef.current++}`;
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(renderId, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (!cancelled && containerRef.current) {
          const message = document.createElement('pre');
          message.className = 'text-xs whitespace-pre-wrap break-all text-destructive';
          message.textContent = `Failed to render diagram: ${error instanceof Error ? error.message : 'Unknown error'}`;
          containerRef.current.replaceChildren(message);
        }
      }
    };
    void renderDiagram();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto" 
    />
  );
}
