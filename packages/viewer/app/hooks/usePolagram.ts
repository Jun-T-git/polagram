import { Polagram, TransformLens } from '@polagram/core';
import yaml from 'js-yaml';
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
  lensYaml: string;
  updateLensYaml: (yamlStr: string) => void;
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
  const [lensYaml, setLensYaml] = useState<string>('');

  // Helper: Generate YAML from pipeline
  const generateLensYaml = (ops: TransformOperation[]) => {
    const enabledOps = ops.filter(op => op.enabled);
    if (enabledOps.length === 0) {
      return '';
    }

    const rules = enabledOps.map(op => {
      const rule: any = {};
      
      if (op.operation === 'focusParticipant') {
        rule.action = 'focus';
        rule.selector = { kind: 'participant', text: op.target };
      } else if (op.operation === 'hideParticipant') {
        rule.action = 'hide';
        rule.selector = { kind: 'participant', text: op.target };
      } else if (op.operation === 'focusFragment') {
        rule.action = 'focus';
        rule.selector = { kind: 'fragment', text: op.target };
      }
      return rule;
    });

    const lens: TransformLens = {
      name: 'Generated Lens',
      rules
    };

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

  // Apply all transformations in the pipeline
  const applyPipeline = (operations: TransformOperation[]) => {
    // Sync YAML
    setLensYaml(generateLensYaml(operations));

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

  // Update pipeline from YAML input
  const updateLensYaml = (yamlStr: string) => {
    setLensYaml(yamlStr);
    
    if (!yamlStr.trim()) {
      const newPipeline: TransformOperation[] = [];
      setPipeline(newPipeline);
      // Manually trigger apply (cannot use applyPipeline as it regenerates YAML)
      // Actually, we want to update pipeline state AND apply it.
      // But avoid re-generating YAML from the forced pipeline update, or accept normalization.
      // Let's normalize: logic flow is YAML -> Pipeline -> (Back to YAML? No, keep user input if possible, 
      // but the requirement says "Sync". If user types comments, they might be lost if we regen.
      // For this implementation, we will regenerate YAML from Pipeline to ensure consistency, 
      // OR we accept that the editor value might jump. 
      // Plan said: "Updates pipeline state... Applies transformation."
      // Let's map YAML to Pipeline.
      
      if (!originalCode) return;
      setTransformedCode(originalCode);
      return;
    }

    try {
      const parsed = yaml.load(yamlStr) as TransformLens;
      if (!parsed || !parsed.rules) {
        // Invalid or empty
        return;
      }

      const newPipeline: TransformOperation[] = parsed.rules.map((rule: any) => {
        let operation: TransformOperation['operation'] = 'focusParticipant';
        let target = '';

        if (rule.action === 'focus') {
             if (rule.selector?.kind === 'participant') operation = 'focusParticipant';
             else if (rule.selector?.kind === 'fragment') operation = 'focusFragment';
        } else if (rule.action === 'hide') {
             if (rule.selector?.kind === 'participant') operation = 'hideParticipant';
        }

        // Extract target from selector
        const selector = rule.selector as any;
        if (selector.text) {
            target = typeof selector.text === 'string' ? selector.text : selector.text.pattern || '';
        }

        return {
          operation,
          target,
          enabled: true // YAML rules are always enabled
        };
      });

      setPipeline(newPipeline);
      
      // Apply without regenerating YAML (to preserve cursor/formatting while typing if we could, 
      // but applyPipeline design updates YAML. We should decouple apply logic.)
      
      // Refactored apply logic to NOT update YAML, but only apply transformations.
      // applyPipeline function above UPDATES YAML. We need a separate function.
      applyTransformationsOnly(newPipeline);

    } catch (e) {
      // Parse error, just ignore or show error
      console.error(e);
      // Keep old pipeline active? Or cleared? 
      // If YAML is invalid, maybe just don't apply changes but keep YAML string.
    }
  };

  const applyTransformationsOnly = (operations: TransformOperation[]) => {
      if (!originalCode) return;
      
      try {
        let builder = Polagram.init(originalCode);
        const enabledOps = operations.filter(op => op.enabled);
        
        for (const op of enabledOps) {
            if (op.operation === 'focusParticipant') builder = builder.focusParticipant(op.target);
            else if (op.operation === 'hideParticipant') builder = builder.hideParticipant(op.target);
            else if (op.operation === 'focusFragment') builder = builder.focusFragment(op.target);
        }

        const newMermaidCode = builder.toMermaid();
        setAst(builder.toAST());
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
