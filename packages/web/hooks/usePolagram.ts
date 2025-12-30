import { Lens, Polagram } from '@polagram/core';
import yaml from 'js-yaml';
import { useEffect, useState } from 'react';

// UI Operations (Legacy keys kept for UI compatibility if needed, but mapped to new API)
export interface TransformOperation {
  operation: 'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup';
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
  getSuggestions: (operationType: 'participant' | 'fragment' | 'group') => string[];
}

// Default YAML content
const DEFAULT_YAML = `version: 1
targets:
  - input: ["diagram.mmd"]
    outputDir: "generated"
    lenses:
      - name: clean-view
        layers: []
`;

export function usePolagram(code: string): UsePolagramReturn {
  const [ast, setAst] = useState<any>(null);
  const [transformedCode, setTransformedCode] = useState(code);
  const [error, setError] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<TransformOperation[]>([]);
  const [lensYaml, setLensYaml] = useState<string>(DEFAULT_YAML);

  // Helper: Convert pipeline operations to Lens object
  const createLensFromPipeline = (ops: TransformOperation[]): Lens => {
    const enabledOps = ops.filter(op => op.enabled);
    
    // If no enabled ops, return empty layers but keep the name
    if (enabledOps.length === 0) {
      return { name: 'My Polagram Lens', layers: [] };
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
      } else if (op.operation === 'removeGroup') {
        layer.action = 'remove';
        layer.selector = { kind: 'group', name: op.target };
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
    // We need to preserve the full config structure
    // Since we don't have the original full object easily accessible here without parsing current YAML again,
    // let's try to parse the current state or default to a skeleton.
    
    let config: any;
    try {
        config = yaml.load(lensYaml);
    } catch (e) {
        config = null;
    }

    // Default structure if missing
    if (!config || typeof config !== 'object') {
         config = {
             version: 1,
             targets: [{
                 input: ["diagram.mmd"],
                 outputDir: "generated",
                 lenses: [{ name: "clean-view", layers: [] }]
             }]
         };
    }

    // Ensure targets[0].lenses[0] exists
    if (!config.targets || !Array.isArray(config.targets) || config.targets.length === 0) {
        config.targets = [{
             input: ["diagram.mmd"],
             outputDir: "generated",
             lenses: [{ name: "clean-view", layers: [] }]
        }];
    }
    if (!config.targets[0].lenses || !Array.isArray(config.targets[0].lenses) || config.targets[0].lenses.length === 0) {
        config.targets[0].lenses = [{ name: "clean-view", layers: [] }];
    }

    const newLens = createLensFromPipeline(ops);
    // Update the first lens's layers
    config.targets[0].lenses[0].layers = newLens.layers;
    
    return yaml.dump(config);
  };

  // Re-run transformation whenever code or lensYaml changes
  useEffect(() => {
    if (!code.trim()) {
      setAst(null);
      setTransformedCode('');
      setError(null);
      return;
    }

    try {
      // 1. Always parse the base AST from the source code
      const builder = Polagram.init(code);
      setAst(builder.toAST());
      setError(null);

      // 2. Apply Lens if it exists
      if (lensYaml.trim()) {
        try {
          const config = yaml.load(lensYaml) as any;
          // Extract the first lens from the first target
          const lens = config?.targets?.[0]?.lenses?.[0];

          if (lens && lens.layers && lens.layers.length > 0) {
            const transformedBuilder = builder.applyLens(lens);
             setTransformedCode(transformedBuilder.toMermaid());
          } else {
             setTransformedCode(code);
          }
        } catch (yamlErr) {
           console.warn('Invalid YAML during apply:', yamlErr);
           setTransformedCode(code); 
        }
      } else {
        setTransformedCode(code);
      }

    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid Regular Expression: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to parse Mermaid code');
      }
      // If code is invalid, we can't transform it.
      setTransformedCode(code); 
      setAst(null);
    }
  }, [code, lensYaml]);

  // Update pipeline from YAML input (Best effort sync for UI)
  const updateLensYaml = (yamlStr: string) => {
    setLensYaml(yamlStr);
    
    if (!yamlStr.trim()) {
      setPipeline([]);
      return;
    }

    try {
      const config = yaml.load(yamlStr) as any;
      const lens = config?.targets?.[0]?.lenses?.[0];

      if (!lens || !lens.layers) {
        // If YAML is valid but structure is empty/missing lenses, clear pipeline
        // But if it's just partial, maybe we should be careful. 
        // For now, if we can parse it but find no lens, it effectively means no ops.
        setPipeline([]); 
        return;
      }

      // Reconstruct pipeline from Lens
      const newPipeline: TransformOperation[] = lens.layers.map((layer: any) => {
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
        } else if (layer.action === 'remove' && layer.selector?.kind === 'group') {
             operation = 'removeGroup';
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
    } catch (e) {
      // Ignore YAML validation errors during typing
      // Keep the previous pipeline state to avoid UI jumping
      // console.warn('Invalid YAML during update:', e);
    }
  };

  // Add a new transformation to the pipeline
  const addTransform = (operation: TransformOperation['operation'], target: string) => {
    const newPipeline = [...pipeline, { operation, target, enabled: true }];
    setPipeline(newPipeline);
    setLensYaml(generateLensYaml(newPipeline));
  };

  // Remove a transformation from the pipeline
  const removeTransform = (index: number) => {
    const newPipeline = pipeline.filter((_, i) => i !== index);
    setPipeline(newPipeline);
    setLensYaml(generateLensYaml(newPipeline));
  };

  // Toggle a transformation's enabled state
  const toggleTransform = (index: number) => {
    const newPipeline = pipeline.map((op, i) => 
      i === index ? { ...op, enabled: !op.enabled } : op
    );
    setPipeline(newPipeline);
    setLensYaml(generateLensYaml(newPipeline));
  };

  // Toggle all transformations on/off
  const toggleAll = () => {
    if (pipeline.length === 0) return;
    const hasEnabled = pipeline.some(op => op.enabled);
    const newPipeline = pipeline.map(op => ({ ...op, enabled: !hasEnabled }));
    setPipeline(newPipeline);
    setLensYaml(generateLensYaml(newPipeline));
  };



  // Get autocomplete suggestions based on operation type
  const getSuggestions = (operationType: 'participant' | 'fragment' | 'group'): string[] => {
    if (!ast) return [];
    
    if (operationType === 'participant') {
      const suggestions: string[] = [];
      ast.participants?.forEach((p: any) => {
        if (p.name) suggestions.push(p.name);
        else if (p.id) suggestions.push(p.id);
      });
      return [...new Set(suggestions)];
    } else if (operationType === 'group') {
      // Assuming AST has groups, usually they are represented in containers or participants
      // Mermaid AST might not expose groups easily at top level if they are just boxes
      // But let's check if we can find them. For now, simple extraction if available.
      // NOTE: Polagram parser might put groups in 'participants' with type 'group' or similar?
      // Or maybe implicitly. If simple parser doesn't expose it, we might return empty.
      // Let's assume standard participants scan for now or check 'boxes' if available.
      // Actually standard mermaid parser puts boxes separately?
      // Let's rely on manual input if AST doesn't expose clearly, or try experimental scan.
      return []; 
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
    getSuggestions
  };
}
