'use client';

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { CodeBlock } from '../components/ui/CodeBlock';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden selection:bg-indigo-500/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-5xl mx-auto text-center animate-fade-in">
        <div className="inline-block mb-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase animate-fade-in-up">
          The Sequence Diagram Transformation Engine
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight text-white drop-shadow-sm">
          Clarity from Chaos
        </h1>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Don't maintain fragmented diagrams. Maintain <span className="text-indigo-400 font-semibold">One Master Diagram</span> and dynamically generate the view you need.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/docs">
             <Button variant="primary" size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all bg-primary hover:bg-primary/90 text-white border-0">
               Get Started
             </Button>
          </Link>
          <Link href="/playground">
             <Button variant="outline" size="lg" className="rounded-full px-8 text-base bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm text-foreground hover:text-white">
               Open Playground
             </Button>
          </Link>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="relative z-10 py-24 px-6 border-t border-border bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">The Philosophy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Software systems are complex, but your documentation shouldn't be noisy.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Step 1: Master Diagram */}
            {/* Step 1: Master Diagram */}
            <div className="flex-1 w-full bg-card border border-border rounded-2xl p-6 relative group hover:border-primary/30 transition-colors shadow-lg min-h-[280px] flex flex-col">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary rounded-lg flex items-center justify-center font-bold text-muted-foreground border border-border shadow-xl z-20 text-sm">1</div>
              <h3 className="text-lg font-semibold mb-3 text-foreground text-center">Master Diagram</h3>
              <div className="space-y-1.5 mb-4 opacity-50 text-[10px] font-mono bg-background p-3 rounded-lg border border-white/5 flex-1">
                 <div className="text-red-400/50">Client-&gt;&gt;API: Req</div>
                 <div className="text-blue-400/50">API-&gt;&gt;Log: Info</div>
                 <div className="text-green-400/50">API-&gt;&gt;DB: Query</div>
                 <div className="text-yellow-400/50">DB--&gt;&gt;API: Res</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                Single Source of Truth.<br/>Contains everything.
              </p>
            </div>

            {/* Operator: Multiply */}
            <div className="flex justify-center text-muted-foreground/40 shrink-0">
               <span className="text-4xl font-light">×</span>
            </div>

            {/* Step 2: Lenses */}
            <div className="flex-1 w-full bg-card border border-primary/20 rounded-2xl p-6 relative group hover:border-primary/40 transition-colors bg-gradient-to-b from-primary/5 to-transparent shadow-lg min-h-[280px] flex flex-col">
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-xl shadow-primary/20 z-20 text-sm">2</div>
              <h3 className="text-lg font-semibold mb-3 text-primary text-center">Lenses</h3>
              <div className="mb-4 space-y-2 flex-1 flex flex-col justify-center">
                 <div className="bg-primary/10 text-primary text-[10px] px-3 py-2 rounded border border-primary/20 font-mono text-center">
                   focus('Client', 'API')
                 </div>
                 <div className="bg-primary/10 text-primary text-[10px] px-3 py-2 rounded border border-primary/20 font-mono text-center">
                   hide(/Log/)
                 </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                Semantic filters.<br/>Focus, Remove, Unwrap.
              </p>
            </div>

             {/* Operator: Equals */}
            <div className="flex justify-center text-muted-foreground/40 shrink-0">
               <span className="text-4xl font-light">=</span>
            </div>

            {/* Step 3: Optimized View */}
            <div className="flex-1 w-full bg-card border border-border rounded-2xl p-6 relative group hover:border-primary/30 transition-colors shadow-lg min-h-[280px] flex flex-col">
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary rounded-lg flex items-center justify-center font-bold text-muted-foreground border border-border shadow-xl z-20 text-sm">3</div>
              <h3 className="text-lg font-semibold mb-3 text-foreground text-center">Optimized View</h3>
               <div className="space-y-1.5 mb-4 font-mono text-[10px] bg-background p-3 rounded-lg border border-white/5 flex-1">
                 <div className="text-red-400">Client-&gt;&gt;API: Req</div>
                 <div className="text-muted-foreground italic opacity-20 text-[9px] my-1 text-center">...</div>
                 <div className="text-yellow-400">API--&gt;&gt;Client: Res</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                Noise-free clarity.<br/>Tailored for the context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Showcase */}
      <section className="relative z-10 py-24 px-6 max-w-5xl mx-auto w-full">
         <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
               <h2 className="text-3xl font-bold mb-6 text-foreground">Designed for Developers</h2>
               <p className="text-muted-foreground mb-8 leading-relaxed">
                 Polagram is built as a library first (`@polagram/core`). It provides a fluent API to manipulate Mermaid ASTs programmatically.
               </p>
               <ul className="space-y-4 text-sm text-muted-foreground">
                 <li className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xs border border-green-500/20">✓</span>
                   Runs entirely in the browser (or Node.js)
                 </li>
                 <li className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xs border border-green-500/20">✓</span>
                   Robust AST-based transformation (not regex hacks)
                 </li>
                 <li className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xs border border-green-500/20">✓</span>
                   TypeScript ready out of the box
                 </li>
               </ul>
                 
               <div className="mt-10">
                  <Link href="/docs/installation">
                     <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary group text-muted-foreground">
                       View Documentation <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                     </Button>
                  </Link>
               </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-2xl relative overflow-hidden group hover:border-border/80 transition-colors">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />
               <div className="flex gap-2 mb-4 opacity-30">
                 <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                 <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                 <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
               </div>
<div className="bg-card rounded-xl border border-border p-0 shadow-2xl relative overflow-hidden group hover:border-border/80 transition-colors">
  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500 z-10" />
  <CodeBlock 
    code={`import { Polagram } from '@polagram/core';

const cleanCode = Polagram.init(masterCode)
  // 1. Focus on PaymentService
  .focusParticipant('PaymentService')
  
  // 2. Remove noisy debug logs
  .removeMessage(/^DEBUG:/)
  
  // 3. Unwrap/Resolve complex fragments
  .resolveFragment('Retry Logic')
  
  // 4. Generate Output
  .toMermaid();`}
    language="typescript"
    className="m-0 border-0 rounded-none shadow-none"
  />
</div>
            </div>
         </div>
      </section>
    </div>
  );
}
