'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

const items = [
  {
    title: 'Overview',
    items: [
      { title: 'Introduction', href: '/docs#introduction' },
      { title: 'Installation', href: '/docs#installation' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Focus Lens', href: '/docs#focus' },
      // { title: 'Filtering', href: '/docs#filtering' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Polagram Builder', href: '/docs/getting-started/installation' }, // Placeholder for now
      // { title: 'Transformation API', href: '/docs/api/reference' },
    ],
  },
];

export function DocsSidebar() {
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

    const ids = ['introduction', 'installation', 'focus'];
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto">
      {items.map((group, i) => (
        <div key={i} className="mb-8">
          <h4 className="mb-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {group.title}
          </h4>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const itemId = item.href.split('#')[1];
              const isActive = activeId === itemId;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center py-2 px-4 text-sm transition-all duration-200 border-l-2",
                      isActive
                        ? "border-primary text-primary bg-primary/5 font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/30"
                    )}
                  >
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
