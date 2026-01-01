'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

const navItems = [
  { label: 'Docs', href: '/docs' },
  { label: 'Playground', href: '/playground' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="h-16 w-full sticky top-0 z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors z-50 relative"
        >
          <Image
            src="/polagram-logo.png"
            alt="Logo"
            width={24}
            height={24}
          />
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Polagram
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href) && item.href !== '/';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="p-2 -mr-2 text-foreground hover:bg-secondary/50 rounded-md transition-colors cursor-pointer">
              <Menu size={24} />
            </SheetTrigger>
            <SheetContent side="right" hideClose className="pt-0 px-0 sm:max-w-xs border-l border-border/40 w-[85vw]">
              <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
                {/* Mobile Menu Header with Branding and Close Button */}
                <div className="px-6 h-16 flex items-center justify-between border-b border-border/40 shrink-0">
                  <div className="flex items-center gap-2 font-bold text-xl">
                    <Image
                      src="/polagram-logo.png"
                      alt="Logo"
                      width={24}
                      height={24}
                    />
                    <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      Polagram
                    </span>
                  </div>
                  <button 
                    onClick={() => setOpen(false)}
                    className="p-2 -mr-2 text-foreground hover:bg-secondary/50 rounded-md transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Mobile Menu Items */}
                <div className="flex flex-col py-6 px-4 gap-2 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href) && item.href !== '/';
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "px-4 py-4 text-lg font-medium rounded-xl transition-all duration-200 flex items-center justify-between group",
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile Menu Footer */}
                <div className="mt-auto p-6 border-t border-border/40 bg-secondary/10">
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-muted-foreground text-center">
                      &copy; {new Date().getFullYear()} Polagram
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
