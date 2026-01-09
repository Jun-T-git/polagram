"use client";

import { Box, ChevronRight, List } from 'lucide-react';
import { useState } from 'react';
import configSchema from '../../app/docs/config-schema.json';

type DocField = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
  children?: DocField[];
  items?: DocField;
  options?: string[];
};

function TypeBadge({ type, required }: { type: string, required?: boolean }) {
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                {type}
            </span>
            {required && (
                <span className="font-bold text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Required
                </span>
            )}
        </div>
    );
}

function PropertyRow({ field, depth = 0 }: { field: DocField, depth?: number }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Determine if this field has nested content worth toggling
    const hasChildren = (field.children && field.children.length > 0) || 
                        (field.type === 'array' && field.items && (field.items.type === 'object' || field.items.type === 'union'));
    
    // For Union types, children are the options
    const isUnion = field.type === 'union' && field.children && field.children.length > 0;

    return (
        <div 
            className="group font-sans relative border-b border-border/40 last:border-0"
            suppressHydrationWarning={true}
        >
            {/* Main Row */}
            <div 
                className={`
                    grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-4 gap-y-2 p-4 transition-colors
                    ${hasChildren ? 'cursor-pointer hover:bg-muted/30' : ''}
                `}
                onClick={hasChildren ? () => setIsOpen(!isOpen) : undefined}
            >
                {/* Column 1: Metadata (Name, Type, Flags) */}
                <div className="flex flex-col gap-1.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                        {/* Toggle Icon */}
                        <div className={`text-muted-foreground/60 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}>
                            {hasChildren ? <ChevronRight size={14} /> : <span className="w-3.5 inline-block" />}
                        </div>
                        
                        {/* Prop Name */}
                        {field.name ? (
                            <code className="text-sm font-bold text-primary font-mono  break-all" title={field.name}>
                                {field.name}
                            </code>
                        ) : (
                            <span className="text-sm text-muted-foreground italic">Item</span>
                        )}
                    </div>
                    
                    {/* Badges container */}
                    <div className="pl-5 flex flex-wrap gap-2">
                         <TypeBadge type={field.type} required={field.required} />
                    </div>
                </div>

                {/* Column 2: Content (Description, Example) */}
                <div className="text-sm text-muted-foreground leading-relaxed pl-5 md:pl-0 min-w-0">
                    <div className="whitespace-pre-wrap mb-2 break-words">
                        {field.description}
                    </div>

                    {field.example && (
                        <div className="mt-3">
                             <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-1 block">Example</span>
                             <div className="bg-muted/40 border border-border/40 rounded px-3 py-2 font-mono text-xs text-foreground/80 break-all">
                                  <span className="select-none opacity-40 mr-2 text-primary">#</span>
                                  {field.example}
                             </div>
                        </div>
                    )}

                    {field.options && field.options.length > 0 && (
                        <div className="mt-4">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-2 block">Allowed Values</span>
                            <div className="flex flex-wrap gap-2">
                                {field.options.map((opt, i) => (
                                    <code key={i} className="px-2 py-1 bg-primary/5 text-primary border border-primary/20 rounded text-xs font-mono">
                                        {opt}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Content Area */}
            {hasChildren && isOpen && (
                <div className="bg-muted/5 border-t border-border/40">
                    {/* Reduced padding for nested content to prevent squashing */}
                    <div className="pl-3 md:pl-6 py-1">
                        {/* Recursive Children (Objects) */}
                        {!isUnion && field.children && (
                            <div className="space-y-0">
                                {field.children.map((child, idx) => (
                                    <PropertyRow 
                                        key={idx} 
                                        field={child} 
                                        depth={depth + 1}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Recursive Array Items */}
                        {field.type === 'array' && field.items && (
                            <div className="space-y-2 py-2">
                                <div className="text-xs uppercase font-bold text-muted-foreground/60 flex items-center gap-2 pl-4">
                                    <List size={12} /> Array Items
                                </div>
                                <div className="border border-border/40 rounded-lg overflow-hidden bg-background ml-4 mr-2">
                                    <PropertyRow 
                                        field={{...field.items, name: ''}} 
                                        depth={depth + 1}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Union Options - Simplfied UI */}
                        {isUnion && field.children && (
                            <div className="space-y-4 py-2 px-2 md:px-4">
                                {field.children.map((option, idx) => {
                                    // Extract title from discriminator or infer from structure
                                    let title = `Option ${idx + 1}`;
                                    let discriminatorValue = '';

                                    if (option.type !== 'object' && option.type !== 'union' && option.type !== 'array') {
                                        // It's a primitive (string, number, boolean)
                                        title = option.type;
                                        // Capitalize
                                        title = title.charAt(0).toUpperCase() + title.slice(1);
                                    } else if (option.children) {
                                        // Check for discriminator first
                                        const disc = option.children.find(c => 
                                            (c.name === 'action' || c.name === 'kind') && c.type.startsWith('"')
                                        );
                                        if (disc) {
                                            discriminatorValue = disc.type.replace(/"/g, '');
                                            title = discriminatorValue;
                                            // Format title like Title Case if it's all lowercase
                                            if (title === title.toLowerCase()) {
                                                title = title.charAt(0).toUpperCase() + title.slice(1);
                                            }
                                        } else {
                                            // Inference based on known patterns (specifically for TextMatcher)
                                            const hasPattern = option.children.some(c => c.name === 'pattern');
                                            const hasFlags = option.children.some(c => c.name === 'flags');
                                            if (hasPattern && hasFlags) {
                                                title = "Regex Object";
                                            } else if (option.type === 'object') {
                                                 title = "Object";
                                            }
                                        }
                                    }

                                    return (
                                        <div key={idx} className="relative">
                                            {/* Minimal Header for Option */}
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className={`h-full w-[3px] rounded-full self-stretch bg-primary/30 mr-1`}></div>
                                                <span className="text-xs font-bold font-mono text-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                                                    {title}
                                                </span>
                                            </div>
                                            
                                            <div className="pl-4 border-l border-border/30 ml-[3px]">
                                                {option.children && option.children.length > 0 ? (
                                                     <div>
                                                         {option.children.map((c, cIdx) => (
                                                             <PropertyRow 
                                                                 key={cIdx} 
                                                                 field={c} 
                                                                 depth={depth + 1}
                                                             />
                                                         ))}
                                                     </div>
                                                ) : (
                                                     <div className="py-2 text-xs text-muted-foreground italic">No extra properties</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({ title, doc, icon: Icon }: { title: string, doc?: DocField, icon?: React.ElementType }) {
  if (!doc) return null;

  // Root or Top-level sections usually contain a list of properties (children)
  // or it could be an array definition itself.
  // Root or Top-level sections usually contain a list of properties (children)
  // or it could be an array definition itself.

  return (
    <div className="mb-16">
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
            {Icon && <Icon className="text-primary w-5 h-5" />}
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
        </div>
        
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
             {doc.children ? (
                 doc.children.map((child, idx) => (
                    <PropertyRow 
                        key={idx} 
                        field={child} 
                    />
                 ))
             ) : (
                // Fallback for single node (e.g. if we pass a Union node directly as the specific section)
                <PropertyRow field={doc} />
             )}
        </div>
    </div>
  );
}

export function ConfigReference() {
    const root = configSchema as DocField;

    return (
        <div className="mt-8">
             <Section title="Configuration Properties" doc={root} icon={Box} />
        </div>
    );
}
