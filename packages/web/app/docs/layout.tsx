import { DocsSidebar } from '../../components/DocsSidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-background">
      
      {/* Desktop Sidebar (Sticky on Left) */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-border bg-background/50 backdrop-blur-sm sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-40">
         <div className="pt-8">
            <DocsSidebar />
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
         <div className="max-w-[900px] mx-auto px-6 py-12 lg:px-12 lg:py-16">
            {children}
         </div>
      </main>
    </div>
  );
}
