'use client';

import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface ExampleContainerProps {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
  controls?: ReactNode;
}

export function ExampleContainer({
  title,
  description,
  className,
  children,
  controls,
}: ExampleContainerProps) {
  return (
    <div className={cn("border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/50", className)}>
      <div className="border-b border-neutral-800 p-4 bg-neutral-900 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-200">{title}</h3>
          {description && <p className="text-sm text-neutral-400">{description}</p>}
        </div>
        {controls && <div className="flex gap-2">{controls}</div>}
      </div>
      <div className="p-0">
        {children}
      </div>
    </div>
  );
}
