'use client';

import { Twitter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground mb-4 w-fit">
              <Image
                src="/polagram-logo.png"
                alt="Polagram Logo"
                width={24}
                height={24}
              />
              <div className="flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Polagram
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Beta
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Generate beautiful, interactive, and resilient sequence diagrams from text. 
              Built for developers who care about clarity and automation.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/playground" className="hover:text-primary transition-colors">Playground</Link></li>
              <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
               <li>
                <a 
                  href="https://x.com/prrr_343" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  X (Twitter)
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Polagram. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a 
              href="https://x.com/prrr_343" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
