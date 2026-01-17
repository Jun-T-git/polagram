import { FileText } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

// biome-ignore lint/suspicious/noExplicitAny: Config structure is complex
export function Sidebar({ config }: { config: any }) {
  const location = useLocation();
  const currentPath = location.pathname.slice(1);
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view');

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-card/30 backdrop-blur-sm">
      <div className="p-4 border-b border-border font-bold flex items-center gap-2 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <img src="/polagram-logo.png" alt="Polagram" className="w-6 h-6" />
        <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent text-lg">
          Polagram
        </span>
      </div>
      <div className="p-4">
        {/* biome-ignore lint/suspicious/noExplicitAny: Target type is complex */}
        {config?.targets?.map((target: any, i: number) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Targets may not have unique IDs
          <div key={i} className="mb-6">
            <div
              className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3 px-2 truncate"
              title={target.input}
            >
              {Array.isArray(target.input)
                ? target.input.join(', ')
                : target.input}
            </div>

            {target._files && target._files.length > 0 ? (
              <div className="flex flex-col gap-1">
                {target._files.map((file: string) => {
                  const isActiveFile = currentPath === file;

                  return (
                    <div key={file}>
                      <NavLink
                        to={`/${file}`}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                            isActive
                              ? 'bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                          }`
                        }
                      >
                        <FileText
                          size={16}
                          className={`min-w-[16px] transition-colors ${isActiveFile ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'}`}
                        />
                        <span className="truncate">{file}</span>
                      </NavLink>

                      {/* Render Lenses if active */}
                      {isActiveFile &&
                        target.lenses &&
                        target.lenses.length > 0 && (
                          <div className="ml-4 mt-1 pl-4 border-l border-border/50 flex flex-col gap-1 py-1">
                            {/* Original View */}
                            <NavLink
                              to={`/${file}`}
                              end
                              className={() =>
                                `text-xs px-3 py-1.5 rounded-md transition-all block ${
                                  !currentView
                                    ? 'bg-secondary text-foreground font-medium border border-white/5'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`
                              }
                            >
                              (Original)
                            </NavLink>

                            {/* Lenses */}
                            {/* biome-ignore lint/suspicious/noExplicitAny: Lens type is complex */}
                            {target.lenses.map((lens: any) => (
                              <NavLink
                                key={lens.name}
                                to={`/${file}?view=${lens.name}`}
                                className={() =>
                                  `text-xs px-3 py-1.5 rounded-md transition-all block ${
                                    currentView === lens.name
                                      ? 'bg-primary/20 text-primary font-medium border border-primary/20'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                  }`
                                }
                              >
                                {lens.name}
                              </NavLink>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-2 text-xs text-muted-foreground/50 italic">
                No files found
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
