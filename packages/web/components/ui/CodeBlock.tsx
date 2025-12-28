'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { cn } from '../../lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, language = 'typescript', filename, className }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function highlight() {
      const highlighted = await codeToHtml(code, {
        lang: language,
        themes: {
           light: 'github-light',
           dark: 'vesper' // A darker/warmer theme fitting the premium aesthetic
        },
        defaultColor: false,
      });
      setHtml(highlighted);
    }
    highlight();
  }, [code, language]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative group rounded-xl bg-card border border-border overflow-hidden my-8 shadow-xl", className)}>
      {/* Header / Window Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-4">
           {/* Traffic Lights */}
            <div className="flex gap-1.5 opacity-60">
            <div className="w-2.5 h-2.5 rounded-full bg-[#fa7878]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#fbd472]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#5fcb88]" />
            </div>
            {filename && (
                <span className="text-xs text-muted-foreground font-mono ml-2">{filename}</span>
            )}
        </div>
        
        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} className="text-secondary-foreground" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-5 overflow-x-auto bg-[#101010]">
         {html ? (
           <div 
             className="text-[13px] font-mono leading-relaxed [&_pre]:bg-transparent! [&_pre]:!m-0 text-white"
             dangerouslySetInnerHTML={{ __html: html }} 
           />
         ) : (
           <pre className="text-[13px] font-mono text-muted-foreground">{code}</pre>
         )}
      </div>
    </div>
  );
}
