import type { LensConfig } from '@polagram/core';
import { Polagram } from '@polagram/core';
import mermaid from 'mermaid';
import { useEffect, useMemo, useRef, useState } from 'react';

interface DiagramViewProps {
  sourceCode: string;
  lens: LensConfig;
  enabledLayers: Set<number>;
}

export default function DiagramView({ sourceCode, lens, enabledLayers }: DiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Compute transformed code based on enabled layers
  const transformedCode = useMemo(() => {
    try {
      const builder = Polagram.init(sourceCode, 'mermaid');
      
      // Apply only enabled layers
      const activeLayers = lens.layers.filter((_, index) => enabledLayers.has(index));
      if (activeLayers.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        builder.applyLens({ name: lens.name, layers: activeLayers } as any);
      }
      
      return builder.toMermaid();
    } catch (error) {
      console.error('Transform error:', error);
      return sourceCode;
    }
  }, [sourceCode, lens, enabledLayers]);

  // Render mermaid diagram
  useEffect(() => {
    if (!contentRef.current) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
    });

    const render = async () => {
      try {
        const { svg } = await mermaid.render('diagram', transformedCode);
        if (contentRef.current) {
          contentRef.current.innerHTML = svg;
          // Reset view on new render
          setScale(1);
          setPosition({ x: 0, y: 0 });
        }
      } catch (error) {
        console.error('Mermaid render error:', error);
        if (contentRef.current) {
          contentRef.current.innerHTML = `<pre style="color: red;">Failed to render diagram</pre>`;
        }
      }
    };

    render();
  }, [transformedCode]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(0.1, scale * delta), 5);
      setScale(newScale);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="diagram-view-container"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="diagram-controls">
        <button onClick={() => setScale(s => Math.min(s * 1.2, 5))}>+</button>
        <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}>Reset</button>
        <button onClick={() => setScale(s => Math.max(s * 0.8, 0.1))}>-</button>
      </div>
      <div 
        ref={contentRef} 
        className="diagram-view-content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />
    </div>
  );
}
