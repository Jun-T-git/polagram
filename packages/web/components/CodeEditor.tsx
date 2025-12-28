import { type ChangeEvent } from 'react';

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
    <div className="relative w-full h-full flex flex-col">
      <textarea
        className="flex-1 w-full bg-transparent text-sm font-mono p-4 resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/30 leading-relaxed"
        value={value}
        onChange={handleChange}
        spellCheck={false}
        placeholder={placeholder || "Enter Mermaid sequence diagram code..."}
      />
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-md flex items-start gap-2 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
          <span>⚠️</span>
          <span className="font-mono whitespace-pre-wrap">{error}</span>
        </div>
      )}
    </div>
  );
}
