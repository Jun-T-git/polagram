import MermaidRenderer from './MermaidRenderer';

interface SequenceDiagramProps {
  code: string;
  error: string | null;
}

export default function SequenceDiagram({ code, error }: SequenceDiagramProps) {
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-destructive/5 text-destructive animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center max-w-md space-y-4">
          <span className="text-4xl mb-2">⚠️</span>
          <p className="font-semibold text-lg">Failed to render diagram</p>
          <p className="text-sm font-mono bg-destructive/10 p-4 rounded-lg border border-destructive/20 whitespace-pre-wrap break-all shadow-sm">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!code.trim()) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-muted-foreground animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center space-y-3 opacity-50">
          <span className="text-4xl mb-2 grayscale">📊</span>
          <p className="font-medium">Enter Mermaid code to see the diagram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
      <div className="min-h-full w-full flex items-center justify-center p-4">
        <MermaidRenderer code={code} />
      </div>
    </div>
  );
}
