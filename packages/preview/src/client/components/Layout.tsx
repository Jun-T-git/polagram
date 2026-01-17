import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Outlet } from 'react-router-dom';
import { useConfig } from '../hooks/useConfig';
import { Sidebar } from './Sidebar';

export default function Layout() {
  const { config, loading, error } = useConfig();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
        Loading config...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-background text-destructive">
        Error: {error}
      </div>
    );

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden">
      <PanelGroup direction="horizontal">
        <Panel
          defaultSize={20}
          minSize={15}
          maxSize={40}
          collapsible
          className="flex flex-col border-r border-border/50"
        >
          <Sidebar config={config} />
        </Panel>

        <PanelResizeHandle className="w-[1px] bg-transparent hover:bg-primary/50 transition-colors" />

        <Panel className="flex flex-col min-w-0">
          <main className="flex-1 w-full h-full overflow-hidden relative">
            <Outlet />
          </main>
        </Panel>
      </PanelGroup>
    </div>
  );
}
