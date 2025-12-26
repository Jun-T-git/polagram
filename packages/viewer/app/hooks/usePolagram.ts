import { Polagram } from '@polagram/core';
import { useEffect, useState } from 'react';

export interface TransformOperation {
  operation: 'focusParticipant' | 'hideParticipant' | 'focusFragment';
  target: string;
  enabled: boolean;
}

interface UsePolagramReturn {
  ast: any;
  transformedCode: string;
  error: string | null;
  pipeline: TransformOperation[];
  addTransform: (operation: 'focusParticipant' | 'hideParticipant' | 'focusFragment', target: string) => void;
  removeTransform: (index: number) => void;
  toggleTransform: (index: number) => void;
  toggleAll: () => void;
  getPipelineCode: () => string;
  getSuggestions: (operationType: 'participant' | 'fragment') => string[];
}

export function usePolagram(code: string): UsePolagramReturn {
  const [ast, setAst] = useState<any>(null);
  const [transformedCode, setTransformedCode] = useState(code);
  const [error, setError] = useState<string | null>(null);
  const [originalCode, setOriginalCode] = useState(code);
  const [pipeline, setPipeline] = useState<TransformOperation[]>([]);

  // Parse the Mermaid code into AST
  useEffect(() => {
    if (!code.trim()) {
      setAst(null);
      setTransformedCode('');
      setError(null);
      return;
    }

    try {
      const builder = Polagram.init(code);
      const parsedAst = builder.toAST();
      setAst(parsedAst);
      setTransformedCode(code);
      setError(null);
      setOriginalCode(code);
      setPipeline([]); // Reset pipeline when code changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Mermaid code');
      setAst(null);
      setTransformedCode(code);
    }
  }, [code]);

  // Apply all transformations in the pipeline
  const applyPipeline = (operations: TransformOperation[]) => {
    if (!originalCode || operations.length === 0) {
      setTransformedCode(originalCode);
      return;
    }

    try {
      let builder = Polagram.init(originalCode);
      
      // Apply only enabled transformations in sequence
      const enabledOps = operations.filter(op => op.enabled);
      for (const op of enabledOps) {
        switch (op.operation) {
          case 'focusParticipant':
            builder = builder.focusParticipant(op.target);
            break;
          case 'hideParticipant':
            builder = builder.hideParticipant(op.target);
            break;
          case 'focusFragment':
            builder = builder.focusFragment(op.target);
            break;
        }
      }

      const transformedAst = builder.toAST();
      const newMermaidCode = builder.toMermaid();
      
      setAst(transformedAst);
      setTransformedCode(newMermaidCode);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply transformations');
    }
  };

  // Add a new transformation to the pipeline
  const addTransform = (operation: 'focusParticipant' | 'hideParticipant' | 'focusFragment', target: string) => {
    const newPipeline = [...pipeline, { operation, target, enabled: true }];
    setPipeline(newPipeline);
    applyPipeline(newPipeline);
  };

  // Remove a transformation from the pipeline
  const removeTransform = (index: number) => {
    const newPipeline = pipeline.filter((_, i) => i !== index);
    setPipeline(newPipeline);
    applyPipeline(newPipeline);
  };

  // Toggle a transformation's enabled state
  const toggleTransform = (index: number) => {
    const newPipeline = pipeline.map((op, i) => 
      i === index ? { ...op, enabled: !op.enabled } : op
    );
    setPipeline(newPipeline);
    applyPipeline(newPipeline);
  };

  // Toggle all transformations on/off
  const toggleAll = () => {
    if (pipeline.length === 0) return;
    
    // If any transformation is enabled, disable all. Otherwise, enable all.
    const hasEnabled = pipeline.some(op => op.enabled);
    const newPipeline = pipeline.map(op => ({ ...op, enabled: !hasEnabled }));
    
    setPipeline(newPipeline);
    applyPipeline(newPipeline);
  };

  // Generate code representation of the pipeline
  const getPipelineCode = (): string => {
    const enabledOps = pipeline.filter(op => op.enabled);
    if (enabledOps.length === 0) return 'Polagram.init(code)';
    
    const operations = enabledOps
      .map(op => `.${op.operation}("${op.target}")`)
      .join('');
    
    return `Polagram.init(code)${operations}.toMermaid()`;
  };

  // Get autocomplete suggestions based on operation type
  const getSuggestions = (operationType: 'participant' | 'fragment'): string[] => {
    if (!ast) return [];
    
    if (operationType === 'participant') {
      // Extract participant names (labels) from AST
      // If alias exists, name holds the alias. If not, name holds the ID.
      // We only show the name to keep the list clean.
      const suggestions: string[] = [];
      ast.participants?.forEach((p: any) => {
        if (p.name) {
          suggestions.push(p.name);
        } else if (p.id) {
          suggestions.push(p.id);
        }
      });
      return [...new Set(suggestions)]; // Remove duplicates
    } else {
      // Extract fragment labels from AST events
      const fragments: string[] = [];
      const extractFragments = (events: any[]) => {
        events?.forEach((event: any) => {
          if (event.kind === 'fragment') {
            event.branches?.forEach((branch: any) => {
              if (branch.condition) {
                fragments.push(branch.condition);
              }
              extractFragments(branch.events);
            });
          }
        });
      };
      extractFragments(ast.events);
      return [...new Set(fragments)]; // Remove duplicates
    }
  };

  return { 
    ast, 
    transformedCode, 
    error, 
    pipeline,
    addTransform,
    removeTransform,
    toggleTransform,
    toggleAll,
    getPipelineCode,
    getSuggestions
  };
}
