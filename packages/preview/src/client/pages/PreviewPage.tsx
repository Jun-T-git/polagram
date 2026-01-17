import type { Layer, Lens, PolagramBuilder, TargetConfig } from '@polagram/core';
import { FormatDetector, Polagram } from '@polagram/core';
import {
    AlertTriangle,
    Code,
    Eye,
    Layers,

    Maximize,
    Minimize,
    PanelRight,
    RotateCcw,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import mermaid from 'mermaid';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    type ImperativePanelHandle,
    Panel,
    PanelGroup,
    PanelResizeHandle
} from 'react-resizable-panels';
import { useLocation, useSearchParams } from 'react-router-dom';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { useConfig } from '../hooks/useConfig';

export default function PreviewPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { config } = useConfig();
  // path is location.pathname without leading slash
  const filePath = location.pathname.slice(1);

  // Inspector State
  const [inspectorTab, setInspectorTab] = useState<
    'controls' | 'source' | 'transformed'
  >('controls');
  const inspectorPanelRef = useRef<ImperativePanelHandle>(null);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);



  // State for layer toggling (Lens)
  const [disabledLayers, setDisabledLayers] = useState<Set<number>>(new Set());

  const [content, setContent] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const viewName = searchParams.get('view');

  // Fetch file content
  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setError(null);
    fetch(`/__api/file?path=${encodeURIComponent(filePath)}`)
      .then(async (res) => {
        if (!res.ok) {
          const staticRes = await fetch(`api/file/${filePath}`);
          if (!staticRes.ok) throw new Error('File not found');
          return staticRes.text();
        }
        return res.text();
      })
      .then((text) => setContent(text))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [filePath]);

  // Calculate target and lens
  const { targetLens } = useMemo(() => {
    if (!config?.targets || !filePath) return { targetLens: null };
    const t = (config.targets as (TargetConfig & { _files?: string[] })[]).find((t) =>
      t._files?.includes(filePath),
    );
    const l =
      t && viewName
        ? t.lenses?.find((lens: Lens) => lens.name === viewName)
        : null;
    return { targetLens: l };
  }, [config, filePath, viewName]);

  // Reset disabled layers when lens changes
  useEffect(() => {
    setDisabledLayers(new Set());
  }, []);

  // Toggle layer helper
  const toggleLayer = (index: number) => {
    setDisabledLayers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!targetLens?.layers) return;
    if (disabledLayers.size === 0) {
      const all = new Set<number>();
      targetLens.layers.forEach((_: unknown, i: number) => {
        all.add(i);
      });
      setDisabledLayers(all);
    } else {
      setDisabledLayers(new Set());
    }
  };

  const toggleInspector = () => {
    const panel = inspectorPanelRef.current;
    if (panel) {
      if (isInspectorCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Transform content
  const { previewCode, displayCode, transformError } = useMemo(() => {
    if (!content || !filePath)
      return { previewCode: null, displayCode: null, transformError: null };

    // 1. Detect format
    const format = FormatDetector.detect(filePath, content);
    if (!format)
      return {
        previewCode: content,
        displayCode: content,
        transformError: null,
      };

    // 2. Initialize
    let pipeline: PolagramBuilder;
    try {
      pipeline = Polagram.init(content, format);
    } catch (e) {
      return {
        previewCode: content,
        displayCode: content,
        transformError: String(e),
      };
    }

    // 4. Apply Lens (Filtered)
    if (targetLens) {
      try {
        const activeLayers = (targetLens.layers || []).filter(
          (_: unknown, index: number) => !disabledLayers.has(index),
        );
        const effectiveLens: Lens = { ...targetLens, layers: activeLayers };
        pipeline.applyLens(effectiveLens);
      } catch (e) {
        return {
          previewCode: content,
          displayCode: content,
          transformError: String(e),
        };
      }
    }

    // 5. Output
    try {
      const previewCode = pipeline.toMermaid();
      let displayCode = previewCode;
      if (format === 'plantuml') {
        displayCode = pipeline.toPlantUML();
      }
      return { previewCode, displayCode, transformError: null };
    } catch (e) {
      return {
        previewCode: content,
        displayCode: content,
        transformError: String(e),
      };
    }
  }, [content, filePath, targetLens, disabledLayers]);

  // Render Mermaid
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
  }, []);

  useEffect(() => {
    if (previewCode) {
      (async () => {
        try {
          const id = `mermaid-${Date.now()}`;
          // clear previous?
          // mermaid.render returns strict SVG string
          // We need to make sure the element doesn't exist or is handled by mermaid internal mock
          const { svg } = await mermaid.render(id, previewCode);
          setSvgContent(svg);
        } catch (e) {
          console.error('Mermaid rendering failed:', e);
          setSvgContent(null);
        }
      })();
    } else {
      setSvgContent(null);
    }
  }, [previewCode]);

  if (!filePath || filePath === '/') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background select-none">
        <div className="mb-6">
          <img 
            src="/polagram-logo.png" 
            alt="Polagram" 
            className="w-24 h-24 opacity-90" 
          />
        </div>

        <h1 className="text-2xl font-bold mb-2 tracking-tight text-foreground">
          Polagram Preview
        </h1>
        
        <p className="text-sm text-muted-foreground max-w-xs text-center leading-relaxed">
          Select a diagram file from the sidebar<br/>to start visualizing your architecture.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Top Toolbar */}
      <div className="border-b border-border p-3 flex items-center justify-between bg-card/30 backdrop-blur-md text-sm shadow-sm z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg overflow-hidden max-w-[150px] md:max-w-md transition-all">
            <Code size={16} className="text-primary shrink-0" />
            <span className="font-mono text-xs truncate" title={filePath}>
              {filePath}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleInspector}
            className={`p-2 rounded-md transition-colors ${!isInspectorCollapsed ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            title="Toggle Inspector"
          >
            <PanelRight size={18} />
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 min-h-0 relative">
        <PanelGroup direction="horizontal">
          {/* Canvas Panel */}
          <Panel minSize={30} className="flex flex-col relative bg-background">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            ></div>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 text-primary font-medium animate-pulse">
                Loading...
              </div>
            )}

            {error && (
              <div className="absolute top-4 left-4 right-4 z-50 text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20 backdrop-blur-xl">
                <h3 className="font-bold flex items-center gap-2">
                  <AlertTriangle size={18} /> Error loading file
                </h3>
                <p className="text-sm opacity-90 mt-1">{error}</p>
              </div>
            )}

            {transformError && (
              <div className="absolute bottom-4 left-4 right-4 z-50 text-orange-400 bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 text-sm">
                <strong className="block mb-1 font-semibold uppercase tracking-wide text-xs">
                  Transformation Warning
                </strong>
                {transformError}
              </div>
            )}
            
            {/* Debug info removed */}



            {svgContent && (
              <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={8}
                limitToBounds={false}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <div
                    className={
                      isFullscreen
                        ? 'fixed inset-0 z-[100] bg-background w-screen h-screen'
                        : 'w-full h-full relative bg-background'
                    }
                  >
                    <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-2 bg-card/80 backdrop-blur-md border border-white/10 p-1.5 rounded-lg shadow-xl">
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-white/10 rounded-md text-foreground transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      >
                        {isFullscreen ? (
                          <Minimize size={18} />
                        ) : (
                          <Maximize size={18} />
                        )}
                      </button>
                      <div className="h-px bg-white/10 my-0.5" />
                      <button
                        type="button"
                        onClick={() => zoomIn()}
                        className="p-2 hover:bg-white/10 rounded-md text-foreground transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => zoomOut()}
                        className="p-2 hover:bg-white/10 rounded-md text-foreground transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => resetTransform()}
                        className="p-2 hover:bg-white/10 rounded-md text-foreground transition-colors"
                        title="Reset View"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>

                    <TransformComponent
                      wrapperClass="w-full h-full !flex items-center justify-center"
                      wrapperStyle={{ width: '100%', height: '100%' }}
                      contentClass="w-full h-full !flex items-center justify-center"
                      contentStyle={{ width: '100%', height: '100%' }}
                    >
                      <div 
                        className="mermaid-preview w-full h-full max-w-[90%] max-h-[90%] [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:h-auto [&>svg]:w-auto flex items-center justify-center bg-transparent"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid SVG is trusted
                        dangerouslySetInnerHTML={{ __html: svgContent || '' }}
                      />
                    </TransformComponent>
                  </div>
                )}
              </TransformWrapper>
            )}
            
          </Panel>
          <PanelResizeHandle className="w-[1px] bg-border hover:bg-primary/50 transition-colors" />

          {/* Inspector Panel */}
          <Panel
            ref={inspectorPanelRef}
            defaultSize={30}
            maxSize={50}
            collapsible
            minSize={0}
            onCollapse={() => setIsInspectorCollapsed(true)}
            onExpand={() => setIsInspectorCollapsed(false)}
            className={`flex flex-col bg-card/40 backdrop-blur-sm border-l border-border ${isInspectorCollapsed ? 'hidden' : ''}`}
          >
            <div className="border-b border-border flex items-center bg-muted/20">
              <button
                type="button"
                onClick={() => setInspectorTab('controls')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${inspectorTab === 'controls' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Layers size={14} /> Lens
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('source')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${inspectorTab === 'source' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Code size={14} /> Source
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('transformed')}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${inspectorTab === 'transformed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Eye size={14} /> Transformed
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-card/20 text-xs font-mono">
              {inspectorTab === 'controls' && (
                <div className="p-4">
                  {targetLens ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-foreground">
                          {targetLens.name}
                        </div>
                        <button
                          type="button"
                          onClick={toggleAll}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${disabledLayers.size === 0 ? 'bg-primary/20 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent'}`}
                        >
                          {disabledLayers.size === 0
                            ? 'Disable All'
                            : 'Enable All'}
                        </button>
                      </div>

                      <ul className="space-y-2">
                        {targetLens.layers?.map((layer: Layer, i: number) => {
                          const isDisabled = disabledLayers.has(i);
                          const isActive = !isDisabled;
                          return (
                            <li
                              // biome-ignore lint/suspicious/noArrayIndexKey: Index is used for toggling
                              key={i}
                              className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${isDisabled ? 'border-border/50 bg-muted/20 opacity-60' : 'border-primary/10 bg-primary/5'}`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleLayer(i)}
                                className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${isActive ? 'bg-primary' : 'bg-muted'}`}
                              >
                                <span
                                  className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`}
                                />
                              </button>

                              <div className="flex flex-col gap-1 w-full min-w-0">
                                <div className="font-bold text-xs uppercase text-accent">
                                  {layer.action}
                                </div>
                                {layer.selector && (
                                  <div className="text-[10px] text-muted-foreground break-all bg-background/50 p-1.5 rounded border border-border/50">
                                    {Object.entries(layer.selector)
                                      .map(([k, v]) =>
                                        typeof v === 'object' && v
                                          ? `${k}:${JSON.stringify(v)}`
                                          : `${k}=${v}`,
                                      )
                                      .join(', ')}
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-10 opacity-70">
                      No Active Lens
                    </div>
                  )}
                </div>
              )}

              {inspectorTab === 'source' && (
                <pre className="p-4 text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {content}
                </pre>
              )}

              {inspectorTab === 'transformed' && (
                <pre className="p-4 text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {displayCode}
                </pre>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
