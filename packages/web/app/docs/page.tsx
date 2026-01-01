
import { Filter, PackageOpen, ScanSearch, Sprout, Zap } from 'lucide-react';

import { LiveDemo } from '../../components/demos/LiveDemo';
import { PhilosophyConcept } from '../../components/docs/PhilosophyConcept';
import { CodeBlock } from '../../components/ui/CodeBlock';

function PropertyDefinition({ name, type, required, description, example }: { name: string; type: string; required?: boolean; description: React.ReactNode; example?: string }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card/30">
      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <code className="text-primary font-bold text-sm bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{name}</code>
        <span className="text-xs font-mono text-muted-foreground">{type}</span>
        {required && <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Required</span>}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </div>
      {example && (
        <div className="mt-3 text-xs bg-muted p-2 rounded border border-border/50 font-mono text-muted-foreground">
          Example: <span className="text-foreground">{example}</span>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  
  return (
    <div className="max-w-[75ch] mx-auto pb-48">
      
      <h1 className="sr-only">Polagram Documentation</h1>

      {/* Introduction */}
      <section id="introduction" className="scroll-mt-32 mb-20 animate-fade-in">
        <div className="mb-6">
            <span className="text-primary font-mono text-[10px] uppercase tracking-widest font-semibold border border-primary/20 bg-primary/10 px-3 py-1 rounded-full">
              Overview
            </span>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-foreground">
          Introduction
        </h2>
        
        <p className="text-xl text-muted-foreground leading-8 mb-8 font-light">
          <strong className="text-foreground font-medium">Polagram</strong> is a sequence diagram transformation engine designed for complex systems. It helps you maintain a single source of truth while generating clarity for every context.
        </p>
      </section>
        
      {/* The Problem */}
      <section id="problem" className="scroll-mt-32 mb-24">
        <h2 className="text-3xl font-bold text-foreground mb-8">The Problem: One Size Doesn&apos;t Fit All</h2>
        <p className="text-muted-foreground mb-6 leading-7">
          Sequence diagrams are a powerful tool for visualizing systems, but a single diagram rarely satisfies everyone&apos;s needs. The &quot;optimal&quot; level of detail depends entirely on your role:
        </p>
        <ul className="space-y-3 text-muted-foreground mb-8 text-sm">
          <li className="flex gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
             <span>
                <strong className="text-foreground">For Developers:</strong> Details like error handling, retry logic, and authentication flows are critical for implementation.
             </span>
          </li>
          <li className="flex gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
             <span>
                <strong className="text-foreground">For Product Managers:</strong> These technical details are noise. They need to see the high-level user journey and happy paths to understand the feature.
             </span>
          </li>
          <li className="flex gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
             <span>
                <strong className="text-foreground">For QA Engineers:</strong> They might need to focus exclusively on specific failure scenarios or edge cases.
             </span>
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 leading-7 bg-muted/30 p-4 rounded-lg border border-border/50">
          Traditionally, this forces a choice: maintain one giant, unreadable diagram, or manually keep multiple diagrams in sync—a recipe for documentation drift. <strong className="text-foreground">Polagram</strong> solves this by dynamically generating all these views from a single source of truth.
        </p>
      </section>
        
      {/* Philosophy Card */}
      <section id="philosophy" className="scroll-mt-32 mb-24">
           <h2 className="text-3xl font-bold text-foreground mb-8">One Diagram. Every View.</h2>
           <p className="text-xl text-muted-foreground leading-8 mb-12 font-light">
             Polagram treats diagrams like code. Instead of maintaining multiple fragmented diagrams manually, you maintain <strong>one master diagram</strong> and use <strong>Lenses</strong> to generate specific views.
           </p>
           
           <div className="my-12">
               <PhilosophyConcept />
           </div>
      </section>

      {/* Live Demo: The Power of Lenses */}
      <section id="demo" className="scroll-mt-32 mb-24 animate-fade-in">
        <h2 className="text-3xl font-bold text-foreground mb-8">The Power of Lenses</h2>
        <p className="text-xl text-muted-foreground leading-8 mb-12 font-light">
          Don&apos;t just take our word for it. <strong className="text-foreground font-medium">Lenses</strong> allow you to transform a complex master diagram into specific views for every stakeholder.
        </p>

        <div className="mb-12">
            <p className="text-muted-foreground mb-6 text-sm">
                Try applying different lenses to the complex diagram below. Notice how the internal logic changes based on the audience.
            </p>
          <LiveDemo />
        </div>
      </section>

      <section id="features" className="mb-24">
        <h2 className="text-2xl font-bold text-foreground mb-8">
             Why Polagram?
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
            {[
                { icon: <ScanSearch className="w-5 h-5" />, title: 'Focus Mode', desc: 'Instantly extract the lifecycle of a specific service.' },
                { icon: <Filter className="w-5 h-5" />, title: 'Noise Reduction', desc: 'Filter out messages or participants using Regex.' },
                { icon: <PackageOpen className="w-5 h-5" />, title: 'Fragment Resolution', desc: 'Unwrap complex alt or loop blocks.' },
                { icon: <Zap className="w-5 h-5" />, title: 'Client-Side', desc: 'Runs entirely in the browser using the library.' },
            ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-card/30 border border-transparent hover:border-border transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {feature.icon}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-foreground">{feature.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.desc}</div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Installation */}
      <section id="installation" className="scroll-mt-32 mb-24 border-t border-border pt-12">
        <div className="mb-6">
            <span className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest font-semibold border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 rounded-full">
              Getting Started
            </span>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-8">Installation</h2>
        <p className="text-muted-foreground mb-8 leading-7">
          Install the Polagram CLI globally or as a development dependency in your project.
        </p>

        <CodeBlock 
            language="bash" 
            code={`npm install -g @polagram/cli
# or
pnpm add -g @polagram/cli`} 
        />

        <h3 className="text-xl font-bold text-foreground mb-4 mt-8">Quick Start</h3>
        <p className="text-muted-foreground mb-6 text-sm">
            Create a <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">polagram.yml</code> configuration file to define your diagram targets and transformations.
        </p>

        <CodeBlock 
            language="yaml" 
            filename="polagram.yml"
            code={`version: 1
targets:
  - input: ["diagram.mmd"]
    outputDir: "generated"
    lenses:
      - name: clean-view
        layers:
          # A comprehensive lens example
          
          # 1. Hide the Logger participant (Remove)
          - action: remove
            selector:
              kind: participant
              name: Logger
              
          # 2. Focus only on critical path participants (Focus)
          - action: focus
            selector:
              kind: participant
              name: API
              
          # 3. Simplify success scenarios (Resolve)
          - action: resolve
            selector:
              kind: fragment
              condition:
                pattern: "Success:.*"`} 
        />
        
        <p className="text-muted-foreground text-sm mt-6 mb-4">
            Then run the CLI to generate your diagrams:
        </p>
        
        <CodeBlock 
            language="bash" 
            code={`polagram generate`}
        />

        <h3 className="text-xl font-bold text-foreground mb-4 mt-8">CLI Options</h3>
        <p className="text-muted-foreground mb-6 text-sm">
            Customize the execution with the following options:
        </p>
        
        <div className="grid gap-4">
            <div className="bg-card/30 p-4 rounded-lg border border-border">
               <div className="flex items-center gap-3 mb-2">
                 <code className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">-c, --config &lt;path&gt;</code>
               </div>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Specify the path to the configuration file. Defaults to <code className="text-foreground">polagram.yml</code> in the current directory.
               </p>
            </div>
            
             <div className="bg-card/30 p-4 rounded-lg border border-border">
               <div className="flex items-center gap-3 mb-2">
                 <code className="text-foreground font-bold bg-muted px-2 py-0.5 rounded border border-border">POLAGRAM_CONFIG</code>
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border border-border px-1.5 py-0.5 rounded">Env Var</span>
               </div>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Alternative way to specify the config file path via environment variable.
               </p>
            </div>
        </div>
      </section>

      {/* CI/CD Integration */}
      <section id="cicd" className="scroll-mt-32 mb-24 border-t border-border pt-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">CI/CD Integration</h2>
        <p className="text-base text-muted-foreground mb-8 leading-7">
          Polagram is built for automation. Generate up-to-date diagrams on every commit using GitHub Actions or your preferred CI provider.
        </p>

        <CodeBlock 
            language="yaml" 
            filename=".github/workflows/diagrams.yml"
            code={`name: Generate Diagrams
on: [push]
jobs:
  diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install Polagram
        run: pnpm add -g @polagram/cli
      
      - name: Generate Diagrams
        run: polagram generate
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: diagrams
          path: generated/`} 
        />
      </section>



      {/* Configuration Specification */}
      <section id="reference" className="scroll-mt-32 mb-24 border-t border-border pt-12">
         <div className="mb-6">
            <span className="text-blue-400 font-mono text-[10px] uppercase tracking-widest font-semibold border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full">
              Reference
            </span>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-8">Specification</h2>
        <p className="text-muted-foreground mb-12">
            Detailed reference for the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">polagram.yml</code> configuration file. The file format is YAML.
        </p>

        <div className="space-y-16">
            
            {/* 1. Root Object */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-2">Root Object</h3>
                <div className="space-y-6">
                    <PropertyDefinition 
                        name="version" 
                        type="number" 
                        required 
                        description="The version of the configuration schema. Currently, only version 1 is supported." 
                    />
                    <PropertyDefinition 
                        name="targets" 
                        type="Target[]" 
                        required 
                        description="A list of conversion targets. Each target defines inputs, output location, and transformations." 
                    />
                </div>
            </div>

            {/* 2. Target Object */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-2">Target</h3>
                <div className="space-y-6">
                    <PropertyDefinition 
                        name="input" 
                        type="string[]" 
                        required 
                        description="Array of file paths or glob patterns to include."
                        example='["src/**/*.mmd"]'
                    />
                    <PropertyDefinition 
                        name="outputDir" 
                        type="string" 
                        required 
                        description="Directory where generated files will be saved."
                    />
                    <PropertyDefinition 
                        name="ignore" 
                        type="string[]" 
                        description="Array of glob patterns to exclude from processing."
                    />
                    <PropertyDefinition 
                        name="lenses" 
                        type="Lens[]" 
                        required 
                        description="List of lenses (transformations) to apply to the input diagrams."
                    />
                </div>
            </div>

            {/* 3. Lens Object */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-2">Lens</h3>
                <div className="space-y-6">
                    <PropertyDefinition 
                        name="name" 
                        type="string" 
                        required 
                        description="Unique name for the lens. Used in the filename suffix (e.g., .web-view.mmd)."
                    />
                    <PropertyDefinition 
                        name="layers" 
                        type="Layer[]" 
                        required 
                        description="Ordered list of transformation layers. Applied sequentially."
                    />
                </div>
            </div>

            {/* 4. Layer Object */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-2">Layer</h3>
                <div className="space-y-6">
                    <PropertyDefinition 
                        name="action" 
                        type="'focus' | 'remove' | 'resolve'" 
                        required 
                        description={
                            <div className="space-y-4 mt-3">
                                <p className="text-sm">The operation to perform on the selected elements. Each action only supports specific selector kinds.</p>
                                
                                {/* Focus */}
                                <div className="border-l-2 border-primary/50 pl-3 py-0.5">
                                    <div className="font-mono text-sm font-bold text-foreground">focus</div>
                                    <p className="text-xs text-muted-foreground mb-1.5">Keeps only interactions involving the selected participants.</p>
                                    <div className="text-xs flex items-center gap-1.5">
                                        <span className="font-semibold text-primary uppercase tracking-wider text-[10px]">Selectors:</span>
                                        <code className="bg-primary/5 border border-primary/10 px-1 py-0.5 rounded text-foreground font-mono">participant</code>
                                    </div>
                                </div>

                                {/* Remove */}
                                <div className="border-l-2 border-primary/50 pl-3 py-0.5">
                                    <div className="font-mono text-sm font-bold text-foreground">remove</div>
                                    <p className="text-xs text-muted-foreground mb-1.5">Removes the selected elements (participants, messages, or groups).</p>
                                    <div className="text-xs flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-primary uppercase tracking-wider text-[10px]">Selectors:</span>
                                        <code className="bg-primary/5 border border-primary/10 px-1 py-0.5 rounded text-foreground font-mono">participant</code>
                                        <code className="bg-primary/5 border border-primary/10 px-1 py-0.5 rounded text-foreground font-mono">message</code>
                                        <code className="bg-primary/5 border border-primary/10 px-1 py-0.5 rounded text-foreground font-mono">group</code>
                                    </div>
                                </div>

                                {/* Resolve */}
                                <div className="border-l-2 border-primary/50 pl-3 py-0.5">
                                    <div className="font-mono text-sm font-bold text-foreground">resolve</div>
                                    <p className="text-xs text-muted-foreground mb-1.5">Unwraps specific branches of fragments (alt, opt, loop).</p>
                                    <div className="text-xs flex items-center gap-1.5">
                                        <span className="font-semibold text-primary uppercase tracking-wider text-[10px]">Selectors:</span>
                                        <code className="bg-primary/5 border border-primary/10 px-1 py-0.5 rounded text-foreground font-mono">fragment</code>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                    <PropertyDefinition 
                        name="selector" 
                        type="Selector" 
                        required 
                        description="Defines which elements to target. The valid fields depend on the `kind` of selector."
                    />
                </div>
            </div>

            {/* 5. Selector Object */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-2">Selector</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Specifies the criteria for selecting elements. All string matching is exact by default. Use an object with <code>pattern</code> for Regex.
                </p>
                
                <h4 className="font-bold text-foreground mb-3 mt-6 text-sm uppercase tracking-wider">Common Fields</h4>
                <div className="space-y-6">
                     <PropertyDefinition 
                        name="kind" 
                        type="'participant' | 'message' | 'fragment' | 'group'" 
                        required 
                        description="The type of element to select."
                    />
                </div>

                <h4 className="font-bold text-foreground mb-3 mt-8 text-sm uppercase tracking-wider">Kind-Specific Fields</h4>
                
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="bg-card/30 p-4 rounded-lg border border-border">
                      <div className="font-mono text-sm font-bold text-primary mb-2">kind: participant</div>
                      <ul className="space-y-3">
                          <li className="text-sm"><code className="font-bold">name</code> (Matcher): Filter by participant name.</li>
                          <li className="text-sm"><code className="font-bold">id</code> (Matcher): Filter by participant ID (alias).</li>
                          <li className="text-sm"><code className="font-bold">stereotype</code> (Matcher): Filter by stereotype (e.g. <code>&lt;&lt;Service&gt;&gt;</code>).</li>
                      </ul>
                   </div>
                   
                   <div className="bg-card/30 p-4 rounded-lg border border-border">
                      <div className="font-mono text-sm font-bold text-primary mb-2">kind: message</div>
                      <ul className="space-y-3">
                          <li className="text-sm"><code className="font-bold">text</code> (Matcher): Filter by message content.</li>
                          <li className="text-sm"><code className="font-bold">from</code> (Matcher): Filter by Sender ID.</li>
                          <li className="text-sm"><code className="font-bold">to</code> (Matcher): Filter by Receiver ID.</li>
                      </ul>
                   </div>

                   <div className="bg-card/30 p-4 rounded-lg border border-border">
                      <div className="font-mono text-sm font-bold text-primary mb-2">kind: fragment</div>
                      <ul className="space-y-3">
                          <li className="text-sm"><code className="font-bold">condition</code> (Matcher): Filter by branch condition text (e.g. &quot;Success&quot;).</li>
                          <li className="text-sm"><code className="font-bold">operator</code> (string | string[]): Filter by loop/alt type.</li>
                      </ul>
                   </div>
                </div>

                <h4 className="font-bold text-foreground mb-3 mt-8 text-sm uppercase tracking-wider text-muted-foreground">Type Definitions</h4>
                <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm font-mono">
                    <div><span className="text-primary">Matcher</span> = string | &#123; pattern: string, flags?: string &#125;</div>
                </div>
            </div>

        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="scroll-mt-32 mb-24 border-t border-border pt-12 opacity-80">
        <h2 className="text-3xl font-bold text-foreground mb-8">Coming Soon</h2>
        <div className="bg-card/30 border border-border/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Sprout className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-foreground mb-2">PlantUML Support</h3>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   We are currently developing support for PlantUML diagrams. 
                   Soon you will be able to apply the same powerful transformations to your existing PlantUML files (.puml).
                 </p>
                 <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-medium text-yellow-500 uppercase tracking-wider">
                   In Development
                 </div>
               </div>
            </div>
        </div>
      </section>

    </div>
  );
}
