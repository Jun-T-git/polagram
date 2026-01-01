'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { DocsSidebar } from '../../components/DocsSidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-background">
      
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden flex items-center px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-16 z-30">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu size={20} />
          <span className="text-sm font-medium">Menu</span>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-card border-r border-border p-6 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <DocsSidebar className="h-full sticky-0 top-0" />
          </aside>
        </div>
      )}

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
