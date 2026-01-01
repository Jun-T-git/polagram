'use client';

import { Dialog } from '@base-ui-components/react/dialog';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Sheet({ 
  children, 
  open, 
  onOpenChange 
}: { 
  children: ReactNode; 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void 
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

export function SheetTrigger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Dialog.Trigger className={className}>
      {children}
    </Dialog.Trigger>
  );
}

export function SheetContent({ 
  children, 
  side = 'right',
  className,
  hideClose = false
}: { 
  children: ReactNode; 
  side?: 'left' | 'right' | 'bottom';
  className?: string;
  hideClose?: boolean;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
      />
      <Dialog.Popup 
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === 'right' && "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === 'left' && "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
          side === 'bottom' && "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
      >
        {!hideClose && (
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        )}
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}
export function SheetClose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Dialog.Close className={className}>
      {children}
    </Dialog.Close>
  );
}
