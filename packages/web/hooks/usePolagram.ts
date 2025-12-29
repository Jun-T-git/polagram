import { Lens, Polagram } from '@polagram/core';
import yaml from 'js-yaml';
import { useEffect, useState } from 'react';

// UI Operations (Legacy keys kept for UI compatibility if needed, but mapped to new API)
export interface TransformOperation {
  operation: 'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage';
  target: string;
  enabled: boolean;
}

interface UsePolagramReturn {
  ast: any;
  transformedCode: string;
  error: string | null;
  pipeline: TransformOperation[];
  lensYaml: string;
  updateLensYaml: (yamlStr: string) => void;
  addTransform: (operation: TransformOperation['operation'], target: string) => void;
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
  const [lensYaml, setLensYaml] = useState<string>('');

  // Helper: Convert pipeline operations to Lens object
  const createLensFromPipeline = (ops: TransformOperation[]): Lens => {
    const enabledOps = ops.filter(op => op.enabled);
    
    if (enabledOps.length === 0) {
      return { name: 'Empty Lens', layers: [] };
    }

    const layers = enabledOps.map(op => {
      const layer: any = {};
      
      if (op.operation === 'focusParticipant') {
        layer.action = 'focus';
        layer.selector = { kind: 'participant', name: op.target };
      } else if (op.operation === 'removeParticipant') {
        layer.action = 'remove';
        layer.selector = { kind: 'participant', name: op.target };
      } else if (op.operation === 'resolveFragment') {
        layer.action = 'resolve';
        layer.selector = { kind: 'fragment', condition: op.target };
      } else if (op.operation === 'removeMessage') {
        layer.action = 'remove';
        // Treat message target as regex pattern for flexibility in demo
        layer.selector = { kind: 'message', text: { pattern: op.target } };
      }
      return layer;
    });

    return {
      name: 'Generated Lens',
      layers
    };
  };

  // Helper: Generate YAML from pipeline
  const generateLensYaml = (ops: TransformOperation[]) => {
    const lens = createLensFromPipeline(ops);
    if (lens.layers.length === 0) {
      return '';
    }
    return yaml.dump(lens);
  };

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
      // Reset pipeline and YAML when code changes
      const newPipeline: TransformOperation[] = [];
      setPipeline(newPipeline);
      setLensYaml(generateLensYaml(newPipeline));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Mermaid code');
      setAst(null);
      setTransformedCode(code);
    }
  }, [code]);

  // Apply transformation using Lens
  const applyLensTransformation = (lens: Lens) => {
      if (!originalCode) return;
      
      try {
        let builder = Polagram.init(originalCode);
        
        // Use applyLens for all transformations
        if (lens.layers.length > 0) {
            builder = builder.applyLens(lens);
        }

        const newMermaidCode = builder.toMermaid();
        setAst(builder.toAST());
        setTransformedCode(newMermaidCode);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply transformations');
      }
  };

  // Apply all transformations in the pipeline
  const applyPipeline = (operations: TransformOperation[]) => {
    // Sync YAML
    setLensYaml(generateLensYaml(operations));
    
    // Create Lens and Apply
    const lens = createLensFromPipeline(operations);
    applyLensTransformation(lens);
  };

  // Update pipeline from YAML input
  const updateLensYaml = (yamlStr: string) => {
    setLensYaml(yamlStr);
    
    if (!yamlStr.trim()) {
      const newPipeline: TransformOperation[] = [];
      setPipeline(newPipeline);
      
      // Apply empty lens
      const emptyLens: Lens = { name: 'Empty', layers: [] };
      applyLensTransformation(emptyLens);
      
      if (!originalCode) return;
      setTransformedCode(originalCode);
      return;
    }

    try {
      const parsed = yaml.load(yamlStr) as Lens;
      if (!parsed || !parsed.layers) {
        return;
      }

      // Reconstruct pipeline from Lens
      const newPipeline: TransformOperation[] = parsed.layers.map((layer: any) => {
        let operation: TransformOperation['operation'] = 'focusParticipant';
        let target = '';

        if (layer.action === 'focus' && layer.selector?.kind === 'participant') {
             operation = 'focusParticipant';
        } else if (layer.action === 'remove' && layer.selector?.kind === 'participant') {
             operation = 'removeParticipant';
        } else if (layer.action === 'resolve' && layer.selector?.kind === 'fragment') {
             operation = 'resolveFragment';
        } else if (layer.action === 'remove' && layer.selector?.kind === 'message') {
             operation = 'removeMessage';
        }

        // Extract target from selector
        const selector = layer.selector as any;
        if (selector) {
            if (selector.name) target = typeof selector.name === 'string' ? selector.name : selector.name.pattern || '';
            else if (selector.condition) target = typeof selector.condition === 'string' ? selector.condition : selector.condition.pattern || '';
            else if (selector.text) target = typeof selector.text === 'string' ? selector.text : selector.text.pattern || '';
        }

        return {
          operation,
          target,
          enabled: true // YAML rules are always enabled
        };
      });

      setPipeline(newPipeline);
      
      // Apply the parsed lens directly
      applyLensTransformation(parsed);

    } catch (e) {
      console.error(e);
      // Don't clear transformed code on partial parse error to avoid flashing
    }
  };


  // Add a new transformation to the pipeline
  const addTransform = (operation: TransformOperation['operation'], target: string) => {
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
    const hasEnabled = pipeline.some(op => op.enabled);
    const newPipeline = pipeline.map(op => ({ ...op, enabled: !hasEnabled }));
    setPipeline(newPipeline);
    applyPipeline(newPipeline);
  };

  // Generate code representation of the pipeline (Updated to show applyLens equivalent ideally, but keeping builder pattern for display if preferred, or we can switch to show lens usage)
  const getPipelineCode = (): string => {
    const enabledOps = pipeline.filter(op => op.enabled);
    if (enabledOps.length === 0) return 'Polagram.init(code)';
    
    // Representing as builder chain is still valid, but we could also show the lens object.
    // For now, let's keep the builder chain representation as it's easier to read for simple ops.
    const operations = enabledOps
      .map(op => `.${op.operation}("${op.target}")`)
      .join('');
    
    return `Polagram.init(code)${operations}.toMermaid()`;
  };

  // Get autocomplete suggestions based on operation type
  const getSuggestions = (operationType: 'participant' | 'fragment'): string[] => {
    if (!ast) return [];
    
    if (operationType === 'participant') {
      const suggestions: string[] = [];
      ast.participants?.forEach((p: any) => {
        if (p.name) suggestions.push(p.name);
        else if (p.id) suggestions.push(p.id);
      });
      return [...new Set(suggestions)];
    } else {
      const fragments: string[] = [];
      const extractFragments = (events: any[]) => {
        events?.forEach((event: any) => {
          if (event.kind === 'fragment') {
            event.branches?.forEach((branch: any) => {
              if (branch.condition) fragments.push(branch.condition);
              extractFragments(branch.events);
            });
          }
        });
      };
      extractFragments(ast.events);
      return [...new Set(fragments)];
    }
  };

  return { 
    ast, 
    transformedCode, 
    error, 
    pipeline,
    lensYaml,
    updateLensYaml,
    addTransform,
    removeTransform,
    toggleTransform,
    toggleAll,
    getPipelineCode,
    getSuggestions
  };
}
