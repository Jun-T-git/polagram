
export function PhilosophyConcept() {
  return (
    <div className="w-full py-12">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 relative">

        {/* 1. Master Diagram */}
        <div className="flex flex-col items-center gap-4 z-10 shrink-0">
             <div className="w-32 h-44 bg-card border border-border rounded-xl p-3 relative shadow-lg flex flex-col justify-center items-center group hover:border-primary/50 transition-colors">
                 <div className="absolute -top-3 -left-3 w-6 h-6 bg-secondary rounded-lg flex items-center justify-center font-bold text-muted-foreground border border-border shadow-md z-20 text-xs">1</div>
                 {/* Master Diagram Visual */}
                 <div className="w-full h-full opacity-50 flex flex-col items-center justify-center">
                     <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60">
                         {/* Lifelines */}
                         <line x1="20" y1="10" x2="20" y2="90" strokeDasharray="4 4" className="opacity-50"></line>
                         <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="4 4" className="opacity-50"></line>
                         <line x1="80" y1="10" x2="80" y2="90" strokeDasharray="4 4" className="opacity-50"></line>
                         
                         {/* Participants */}
                         <rect x="10" y="5" width="20" height="10" rx="2" className="fill-card"></rect>
                         <rect x="40" y="5" width="20" height="10" rx="2" className="fill-card"></rect>
                         <rect x="70" y="5" width="20" height="10" rx="2" className="fill-card"></rect>

                         {/* Messages */}
                         <line x1="20" y1="30" x2="50" y2="30"></line>
                         <path d="M47 27l3 3-3 3"></path>
                         
                         <line x1="50" y1="45" x2="80" y2="45"></line>
                         <path d="M77 42l3 3-3 3"></path>

                         <line x1="80" y1="60" x2="50" y2="60" strokeDasharray="3 3"></line>
                         <path d="M53 63l-3-3 3-3"></path>

                         <line x1="50" y1="75" x2="20" y2="75" strokeDasharray="3 3"></line>
                         <path d="M23 78l-3-3 3-3"></path>
                     </svg>
                 </div>
                 <div className="absolute bottom-3 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">master.mmd</div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</p>
        </div>

        {/* Operator: Branching/Multiply */}
        <div className="text-muted-foreground/30 text-2xl font-light hidden md:block">
            ×
        </div>

        {/* 2. Lenses (Vertical Stack) */}
        <div className="flex flex-col items-center gap-4 z-10 shrink-0">
             <div className="flex flex-col gap-3 relative p-4 border border-dashed border-border/50 rounded-2xl bg-muted/5">
                 <div className="absolute -top-3 -left-3 w-6 h-6 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-xs z-30">2</div>
                 <div className="absolute -top-3 left-4 px-2 py-0.5 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-[10px] z-20 font-mono">polagram.yml</div>
                 
                 {/* Lens 1: Dev (Green) */}
                 <div className="w-48 h-12 bg-card border border-green-500/30 rounded-lg flex items-center px-3 gap-3 shadow-sm hover:translate-x-1 transition-transform group">
                     <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform"></div>
                     <span className="text-[11px] font-semibold text-foreground/80">Lens for Developers</span>
                 </div>
                 {/* Lens 2: PM (Blue) */}
                 <div className="w-48 h-12 bg-card border border-blue-500/30 rounded-lg flex items-center px-3 gap-3 shadow-sm hover:translate-x-1 transition-transform group">
                     <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div>
                     <span className="text-[11px] font-semibold text-foreground/80">Lens for PMs</span>
                 </div>
                 {/* Lens 3: QA (Orange) */}
                 <div className="w-48 h-12 bg-card border border-orange-500/30 rounded-lg flex items-center px-3 gap-3 shadow-sm hover:translate-x-1 transition-transform group">
                     <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:scale-125 transition-transform"></div>
                     <span className="text-[11px] font-semibold text-foreground/80">Lens for QA</span>
                 </div>
             </div>
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lenses</p>
        </div>

         {/* Operator: Equals/Arrow */}
        <div className="text-muted-foreground/30 text-2xl font-light hidden md:block">
            =
        </div>

        {/* 3. Optimized Views (Vertical Stack matching Lenses) */}
         <div className="flex flex-col items-center gap-4 z-10 shrink-0">
             <div className="flex flex-col gap-3 relative p-4 border border-dashed border-border/50 rounded-2xl bg-muted/5">
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-secondary rounded-lg flex items-center justify-center font-bold text-muted-foreground border border-border shadow-md z-30 text-xs">3</div>

                 {/* View 1: Dev */}
                 <div className="w-48 h-12 bg-card border border-green-500/30 rounded-lg flex items-center justify-between px-3 shadow-sm hover:translate-x-1 transition-transform">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                         </div>
                         <span className="text-[10px] font-mono text-foreground">diagram.dev.mmd</span>
                      </div>
                 </div>
                 {/* View 2: PM */}
                 <div className="w-48 h-12 bg-card border border-blue-500/30 rounded-lg flex items-center justify-between px-3 shadow-sm hover:translate-x-1 transition-transform">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                             <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                         </div>
                          <span className="text-[10px] font-mono text-foreground">diagram.pm.mmd</span>
                      </div>
                 </div>
                 {/* View 3: QA */}
                 <div className="w-48 h-12 bg-card border border-orange-500/30 rounded-lg flex items-center justify-between px-3 shadow-sm hover:translate-x-1 transition-transform">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                         </div>
                          <span className="text-[10px] font-mono text-foreground">diagram.qa.mmd</span>
                      </div>
                 </div>
             </div>
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optimized Views</p>
        </div>

      </div>
    </div>
  );
}
