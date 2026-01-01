'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

const items = [
  {
    title: 'Overview',
    items: [
      { title: 'Introduction', href: '/docs#introduction' },
      { title: 'The Problem', href: '/docs#problem' },
      { title: 'Philosophy', href: '/docs#philosophy' },
      { title: 'Live Demo', href: '/docs#demo' },
    ],
  },
  {
    title: 'Getting Started',
    items: [
      { title: 'Installation', href: '/docs#installation' },
      { title: 'CI/CD Integration', href: '/docs#cicd' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { title: 'Specification', href: '/docs#reference' },
      { title: 'Roadmap', href: '/docs#roadmap' },
    ],
  },
];

interface DocsSidebarProps {
  className?: string;
}

export function DocsSidebar({ className }: DocsSidebarProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -80% 0px' }
    );

    const ids = ['introduction', 'problem', 'philosophy', 'demo', 'installation', 'cicd', 'reference', 'roadmap'];
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("w-full h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto", className)}>
      {items.map((group, i) => (
        <div key={i} className="mb-6">
          <h4 className="mb-2 px-3 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            {group.title}
          </h4>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const itemId = item.href.split('#')[1];
              const isActive = activeId === itemId;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setActiveId(itemId)}
                    className={cn(
                      "group flex items-center py-2 px-3 text-sm transition-colors duration-200 rounded-md relative",
                      isActive
                        ? "text-foreground font-medium bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
                    )}
                    {item.title}
                  </Link>
                </li>
             );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
