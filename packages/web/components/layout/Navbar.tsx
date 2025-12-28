'use client';

import { Github } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Docs', href: '/docs' },
  { label: 'Examples', href: '/examples/focus' }, // Temporary link to first example
  { label: 'Playground', href: '/playground' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="h-16 w-full sticky top-0 z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors"
        >
          <span className="text-2xl">🎭</span>
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Polagram
          </span>
        </Link>

        <div className="flex items-center gap-6">
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
          
          <div className="w-px h-5 bg-border" />
          
          <Link
            href="https://github.com/teraokajun/polagram"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "p-2 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
            aria-label="GitHub"
          >
             <Github className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
