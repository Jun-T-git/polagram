'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { CodeBlock } from '../components/ui/CodeBlock';
import { MermaidDiagram } from '../components/ui/MermaidDiagram';
import { cn } from '../lib/utils';

export default function Home() {
  const [masterView, setMasterView] = useState<'diagram' | 'code'>('diagram');
  const [optimizedView, setOptimizedView] = useState<'diagram' | 'code'>('diagram');
  
  // Master diagram with all details
  const masterDiagram = `sequenceDiagram
    User->>Client: Checkout
    Client->>AuthAPI: POST /auth/verify
    alt Success: Auth
        AuthAPI->>DB: Check token
        DB-->>AuthAPI: Valid
    else Invalid
        AuthAPI-->>Client: 401 Error
    end
    AuthAPI-->>Client: 200 OK
    Client->>PaymentAPI: POST /payment/charge
    alt Success: Payment
        PaymentAPI->>DB: Save transaction
        DB-->>PaymentAPI: Saved
    else Failed
        PaymentAPI-->>Client: 500 Error
    end
    PaymentAPI-->>Client: 200 OK
    Client-->>User: Order confirmed`;
  
  // Optimized diagram (DB removed, Success fragments resolved)
  const optimizedDiagram = `sequenceDiagram
    User->>Client: Checkout
    Client->>AuthAPI: POST /auth/verify
    AuthAPI-->>Client: 200 OK
    Client->>PaymentAPI: POST /payment/charge
    PaymentAPI-->>Client: 200 OK
    Client-->>User: Order confirmed`;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden selection:bg-indigo-500/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Hero + Philosophy Section */}
      <section className="relative z-10 pt-12 pb-12 md:pt-20 md:pb-16 px-6 max-w-6xl mx-auto animate-fade-in">
        {/* Hero Content */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase animate-fade-in-up">
            Sequence Diagram Transformation Engine
          </div>
          
          <h1 className="text-3xl md:text-5xl text-foreground mb-6 max-w-2xl mx-auto leading-tight font-bold">
            One Diagram. Every View.
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Don&apos;t maintain fragmented diagrams. Transform one master diagram into optimised views for every context.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
        </div>

        {/* Transformation Flow */}
        <div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-stretch justify-center">
            {/* Step 1: Master Diagram */}
            <div className="flex-1 w-full bg-card border border-border rounded-2xl p-6 relative group hover:border-primary/30 transition-colors shadow-lg h-[420px] flex flex-col">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary rounded-lg flex items-center justify-center font-bold text-muted-foreground border border-border shadow-xl z-20 text-sm">1</div>
              <h3 className="text-lg font-semibold mb-3 text-foreground text-center">Master Diagram</h3>
              <div className="flex-1 bg-background/50 rounded-lg border border-white/5 overflow-hidden flex flex-col">
                {/* Header bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-background/30">
                  <span className="text-[10px] font-mono text-muted-foreground">order-seq.mmd</span>
                  <div className="flex gap-1 bg-muted/30 p-0.5 rounded">
                    <button onClick={() => setMasterView('diagram')} className={cn("w-14 px-2 py-0.5 text-[9px] rounded transition-colors", masterView === 'diagram' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>Preview</button>
                    <button onClick={() => setMasterView('code')} className={cn("w-14 px-2 py-0.5 text-[9px] rounded transition-colors", masterView === 'code' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>Code</button>
                  </div>
                </div>
                {/* Content area */}
                {masterView === 'diagram' ? (
                  <div className="flex-1 p-4 flex items-center justify-center overflow-auto custom-scrollbar">
                    <MermaidDiagram chart={masterDiagram} className="scale-95 origin-center" />
                  </div>
                ) : (
                  <div className="flex-1 p-3 overflow-y-auto bg-[#101010] custom-scrollbar">
                    <pre className="text-[9px] font-mono text-muted-foreground leading-relaxed">{masterDiagram}</pre>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-center mt-2">
                Single Source of Truth.<br/>Contains everything.
              </p>
            </div>

            {/* Operator: Multiply */}
            <div className="flex justify-center items-center text-muted-foreground/40 shrink-0 py-2 md:py-0">
               <span className="text-4xl font-light">×</span>
            </div>

            {/* Step 2: Lens */}
            <div className="flex-1 w-full bg-card border border-primary/20 rounded-2xl p-6 relative group hover:border-primary/40 transition-colors bg-gradient-to-b from-primary/5 to-transparent shadow-lg h-[420px] flex flex-col">
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-xl shadow-primary/20 z-20 text-sm">2</div>
              <h3 className="text-lg font-semibold mb-3 text-primary text-center">Polagram Lens</h3>
              <div className="flex-1 bg-background/50 rounded-lg border border-white/5 overflow-hidden flex flex-col">
                {/* Header bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-background/30">
                  <span className="text-[10px] font-mono text-primary">polagram.yml</span>
                </div>
                {/* Content area */}
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                  <pre className="text-[9px] font-mono text-primary/90 leading-relaxed">
                    <span className="text-muted-foreground/40">...</span>
{`
- action: remove
  selector:
    kind: participant
    name: DB

- action: resolve
  selector:
    kind: fragment
    condition:
      pattern: "Success:.*"
`}
                    <span className="text-muted-foreground/40">...</span>
                  </pre>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-center mt-2">
                Hide DB details.<br/>Focus on API flow.
              </p>
            </div>

             {/* Operator: Equals */}
            <div className="flex justify-center items-center text-muted-foreground/40 shrink-0 py-2 md:py-0">
               <span className="text-4xl font-light">=</span>
            </div>

            {/* Step 3: Optimized View */}
            <div className="flex-1 w-full bg-card border border-border rounded-2xl p-6 relative group hover:border-primary/30 transition-colors shadow-lg h-[420px] flex flex-col">
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary rounded-lg flex items-center justify-center font-bold text-muted-foreground border border-border shadow-xl z-20 text-sm">3</div>
              <h3 className="text-lg font-semibold mb-3 text-foreground text-center">Optimized View</h3>
              <div className="flex-1 bg-background/50 rounded-lg border border-white/5 overflow-hidden flex flex-col">
                {/* Header bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-background/30">
                  <span className="text-[10px] font-mono text-green-400">order-seq.success.mmd</span>
                  <div className="flex gap-1 bg-muted/30 p-0.5 rounded">
                    <button onClick={() => setOptimizedView('diagram')} className={cn("w-14 px-2 py-0.5 text-[9px] rounded transition-colors", optimizedView === 'diagram' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>Preview</button>
                    <button onClick={() => setOptimizedView('code')} className={cn("w-14 px-2 py-0.5 text-[9px] rounded transition-colors", optimizedView === 'code' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>Code</button>
                  </div>
                </div>
                {/* Content area */}
                {optimizedView === 'diagram' ? (
                  <div className="flex-1 p-4 flex items-center justify-center overflow-auto custom-scrollbar">
                    <MermaidDiagram chart={optimizedDiagram} className="scale-100 origin-center" />
                  </div>
                ) : (
                  <div className="flex-1 p-3 overflow-y-auto bg-[#101010] custom-scrollbar">
                    <pre className="text-[9px] font-mono text-muted-foreground leading-relaxed">{optimizedDiagram}</pre>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-center mt-2">
                Clean & focused.<br/>Ready for documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Showcase */}
      <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto w-full border-t border-border bg-white/[0.01]">
         <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
               <h2 className="text-3xl font-bold mb-6 text-foreground">Built for Your Workflow</h2>
               <p className="text-muted-foreground mb-8 leading-relaxed">
                 Define transformations in <code className="text-primary">polagram.yml</code> and integrate seamlessly into your CI/CD pipeline. Generate focused diagrams automatically on every commit.
               </p>
               <ul className="space-y-4 text-sm text-muted-foreground">
                 <li className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xs border border-green-500/20">✓</span>
                   Declarative YAML configuration
                 </li>
                 <li className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xs border border-green-500/20">✓</span>
                   CLI-first for CI/CD integration
                 </li>

                 <li className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xs border border-green-500/20">✓</span>
                   Native Mermaid support
                 </li>
               </ul>
                 
               <div className="mt-10">
                  <Link href="/docs">
                     <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary group text-muted-foreground">
                       View Documentation <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                     </Button>
                  </Link>
               </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl relative overflow-hidden group hover:border-primary/20 transition-all flex flex-col h-full min-h-[460px]">
               {/* Accent bar */}
               <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary opacity-50" />
               
               {/* Tab Switcher */}
               <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-background/30">
                 <span className="text-[10px] font-mono text-muted-foreground">Code Example</span>
                 <div className="flex gap-1 bg-muted/30 p-0.5 rounded">
                   <div className="px-2 py-0.5 text-[9px] rounded bg-primary text-white">
                     YAML
                   </div>
                 </div>
               </div>

               {/* Code content */}
               <div className="flex-1 relative overflow-hidden">
                  <CodeBlock 
                    code={`version: 1
targets:
  - input: ["diagram.mmd"]
    outputDir: "generated"
    lenses:
      - name: frontend-success
        layers:
          - action: focus
            selector:
              kind: participant
              name: Frontend
          - action: resolve
            selector:
              kind: fragment
              condition:
                pattern: "^Success:"`}
                    language="yaml"
                    className="m-0 border-0 rounded-none shadow-none h-full"
                    showHeader={false}
                  />
               </div>

            </div>
         </div>
      </section>
    </div>
  );
}
