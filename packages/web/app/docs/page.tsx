'use client';

import { FocusDemo } from '../../components/demos/FocusDemo';
import { CodeBlock } from '../../components/ui/CodeBlock';

export default function DocsPage() {
  return (
    <div className="max-w-[75ch] mx-auto pb-48">
      
      {/* Introduction */}
      <section id="introduction" className="scroll-mt-32 mb-32 animate-fade-in">
        <div className="mb-6">
            <span className="text-primary font-mono text-[10px] uppercase tracking-widest font-semibold border border-primary/20 bg-primary/10 px-3 py-1 rounded-full">
              Overview
            </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
          Introduction
        </h1>
        
        <p className="text-xl text-muted-foreground leading-8 mb-12 font-light">
          <strong className="text-foreground font-medium">Polagram</strong> is a sequence diagram transformation engine designed for complex systems. It helps you maintain a single source of truth while generating clarity for every context.
        </p>
        
        {/* Philosophy Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 mb-16 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-foreground">The Philosophy: Clarity from Chaos</h2>
            <p className="text-muted-foreground mb-8 leading-7 text-sm">
                In real-world distributed systems, a "complete" sequence diagram is often too noisy. It lists every log line and health check. However, maintaining separate simplified diagrams leads to drift.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="glass-card p-5 rounded-lg border border-border hover:border-primary/50 transition-colors">
                     <div className="text-primary font-medium mb-1 text-sm">1. The Master Diagram</div>
                     <p className="text-xs text-muted-foreground leading-relaxed">Your single source of truth containing everything.</p>
                 </div>
                 <div className="glass-card p-5 rounded-lg border border-border hover:border-purple-500/50 transition-colors">
                     <div className="text-purple-400 font-medium mb-1 text-sm">2. Lenses</div>
                     <p className="text-xs text-muted-foreground leading-relaxed">Semantic filters to generate specific views. (Regex, Focus, Unwrap)</p>
                 </div>
            </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-6 mt-12">
             Why Polagram?
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
            {[
                { icon: '🔍', title: 'Focus Mode', desc: 'Instantly extract the lifecycle of a specific service.' },
                { icon: '🙈', title: 'Noise Reduction', desc: 'Filter out messages or participants using Regex.' },
                { icon: '📦', title: 'Fragment Resolution', desc: 'Unwrap complex alt or loop blocks.' },
                { icon: '🚀', title: 'Client-Side', desc: 'Runs entirely in the browser using the library.' },
            ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-card/30 border border-transparent hover:border-border transition-colors">
                    <span className="text-xl opacity-80">{feature.icon}</span>
                    <div>
                        <div className="text-sm font-medium text-foreground">{feature.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.desc}</div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Installation */}
      <section id="installation" className="scroll-mt-32 mb-32 border-t border-border pt-24">
        <h2 className="text-3xl font-bold text-foreground mb-6">Installation</h2>
        <p className="text-muted-foreground mb-8 leading-7">
          Polagram is available as an npm package. It is designed to be lightweight and zero-dependency for runtime usage.
        </p>

        <CodeBlock 
            language="bash" 
            code={`npm install @polagram/core
# or
pnpm add @polagram/core
# or
yarn add @polagram/core`} 
        />

        <h3 className="text-xl font-semibold text-foreground mb-4 mt-12">Quick Start (Node.js)</h3>
        <p className="text-muted-foreground mb-6 text-sm">
            Here is a minimal example of how to load a diagram and apply a focus filter.
        </p>

        <CodeBlock 
            language="typescript" 
            filename="example.ts"
            code={`import { Polagram } from '@polagram/core';

const masterCode = \`sequenceDiagram ...\`;

const cleanCode = Polagram.init(masterCode)
  // Hide the Logger participant
  .removeParticipant('Logger')
  .toMermaid();

console.log(cleanCode);`} 
        />
      </section>

      {/* Tutorials: Focus */}
      <section id="focus" className="scroll-mt-32 mb-24 border-t border-border pt-24">
         <div className="mb-6">
            <span className="text-purple-400 font-mono text-[10px] uppercase tracking-widest font-semibold border border-purple-500/20 bg-purple-500/10 px-3 py-1 rounded-full">
              Tutorial
            </span>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-6">Focus Lens</h2>
        <p className="text-base text-muted-foreground mb-8 leading-7">
          The <strong>Focus</strong> lens is one of the most powerful tools in Polagram. 
          It allows you to select one or more participants and show only their relevant interactions.
        </p>

        <div className="mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-4">Try it Live</h3>
            <p className="text-muted-foreground mb-6 text-sm">
                Click "Focus Web" below. Notice how interactions between API and DB (which don't involve Web directly) disappear.
            </p>
            <div className="my-8 rounded-xl overflow-hidden border border-border shadow-2xl bg-card">
                <FocusDemo />
            </div>
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-4">How it Works</h3>
         <p className="text-muted-foreground mb-6 text-sm">
          By applying <code>.focusParticipant('Name')</code>, Polagram recursively checks every message in the AST and keeps only relevant interactions.
        </p>

        <CodeBlock 
            language="typescript" 
            code={`import { Polagram } from '@polagram/core';

// Focus on a single participant
const view1 = Polagram.init(code)
  .focusParticipant('Web')
  .toMermaid();

// Chain multiple operations
const view2 = Polagram.init(code)
  .focusParticipant(/Web|API/)
  .removeMessage(/^DEBUG:/)
  .toMermaid();`} 
        />
      </section>

    </div>
  );
}
