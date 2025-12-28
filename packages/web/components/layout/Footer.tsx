'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground mb-4">
              <span>🎭</span>
              <span>Polagram</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Generate beautiful, interactive, and resilient sequence diagrams from text. 
              Built for developers who care about clarity and automation.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="/examples/focus" className="hover:text-primary transition-colors">Examples</Link></li>
              <li><Link href="/playground" className="hover:text-primary transition-colors">Playground</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Community</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="https://github.com/teraokajun/polagram" 
                  target="_blank" 
                  className="hover:text-primary transition-colors"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link 
                  href="https://github.com/teraokajun/polagram/issues" 
                  target="_blank" 
                  className="hover:text-primary transition-colors"
                >
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Polagram. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
