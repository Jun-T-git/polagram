import { EventNode, Layer, Lens, Participant, Polagram, PolagramRoot, TextMatcher } from '@polagram/core';
import yaml from 'js-yaml';
import { useMemo, useState } from 'react';

// UI Operations (Legacy keys kept for UI compatibility if needed, but mapped to new API)
export interface TransformOperation {
  operation: 'focusParticipant' | 'removeParticipant' | 'resolveFragment' | 'removeMessage' | 'removeGroup';
  target: string;
  isRegex?: boolean;
  enabled: boolean;
}

interface UsePolagramReturn {
  ast: PolagramRoot | null;
  transformedCode: string;
  error: string | null;
  pipeline: TransformOperation[];
  lensYaml: string;
  updateLensYaml: (yamlStr: string) => void;
  addTransform: (operation: TransformOperation['operation'], target: string, isRegex?: boolean) => void;
  removeTransform: (index: number) => void;
  toggleTransform: (index: number) => void;
  toggleAll: () => void;
  getSuggestions: (operationType: 'participant' | 'fragment' | 'group' | 'message') => string[];
}

// Internal Config Shape for YAML parsing
interface ConfigShape {
    version?: number;
    targets?: {
        input: string[];
        outputDir: string;
        lenses: Lens[];
    }[];
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

// Helper to extract string and regex status from TextMatcher
function getTextMatcherInfo(tm: TextMatcher | undefined): { target: string, isRegex: boolean } {
    if (!tm) return { target: '', isRegex: false };
    if (typeof tm === 'string') return { target: tm, isRegex: false };
    if (tm instanceof RegExp) return { target: tm.source, isRegex: true };
    if ('pattern' in tm) return { target: tm.pattern, isRegex: true };
    return { target: '', isRegex: false };
}

export function usePolagram(code: string): UsePolagramReturn {
  const [pipeline, setPipeline] = useState<TransformOperation[]>([]);
  const [lensYaml, setLensYaml] = useState<string>(DEFAULT_YAML);

  // Derived state for AST, transformed code, and error
  const { ast, transformedCode, error } = useMemo(() => {
    if (!code.trim()) {
      return { ast: null, transformedCode: '', error: null };
    }

    try {
      // 1. Always parse the base AST from the source code
      const builder = Polagram.init(code);
      const computedAst = builder.toAST();
      let computedCode = code;

      // 2. Apply Lens if it exists
      if (lensYaml.trim()) {
        try {
          const config = yaml.load(lensYaml) as ConfigShape;
          // Extract the first lens from the first target
          const lens = config?.targets?.[0]?.lenses?.[0];

          if (lens && lens.layers && lens.layers.length > 0) {
            const transformedBuilder = builder.applyLens(lens);
            computedCode = transformedBuilder.toMermaid();
          }
        } catch (yamlErr) {
           console.warn('Invalid YAML during apply:', yamlErr);
           // Keep original code on YAML error, but don't fail the whole hook
        }
      }

      return { ast: computedAst, transformedCode: computedCode, error: null };

    } catch (err) {
      let errorMessage = 'Failed to parse Mermaid code';
      if (err instanceof SyntaxError) {
        errorMessage = `Invalid Regular Expression: ${err.message}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      // If code is invalid, we can't transform it.
      return { ast: null, transformedCode: code, error: errorMessage };
    }
  }, [code, lensYaml]);

  // Helper: Convert pipeline operations to Lens object
  const createLensFromPipeline = (ops: TransformOperation[]): Lens => {
    const enabledOps = ops.filter(op => op.enabled);
    
    // If no enabled ops, return empty layers but keep the name
    if (enabledOps.length === 0) {
      return { name: 'My Polagram Lens', layers: [] };
    }

    const layers: Layer[] = enabledOps.map(op => {
      const matcher = op.isRegex ? { pattern: op.target } : op.target;

      if (op.operation === 'focusParticipant') {
        return {
          action: 'focus',
          selector: { kind: 'participant', name: matcher }
        };
      } else if (op.operation === 'removeParticipant') {
        return {
          action: 'remove',
          selector: { kind: 'participant', name: matcher }
        };
      } else if (op.operation === 'resolveFragment') {
        return {
          action: 'resolve',
          selector: { kind: 'fragment', condition: matcher }
        };
      } else if (op.operation === 'removeMessage') {
        return {
          action: 'remove',
          selector: { kind: 'message', text: matcher }
        };
      } else {
        // removeGroup
        return {
          action: 'remove',
          selector: { kind: 'group', name: matcher }
        };
      }
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
    
    let config: unknown;
    try {
        config = yaml.load(lensYaml);
    } catch {
        config = null;
    }

    let typedConfig = config as ConfigShape;

    // Default structure if missing
    if (!typedConfig || typeof typedConfig !== 'object') {
         typedConfig = {
             version: 1,
             targets: [{
                 input: ["diagram.mmd"],
                 outputDir: "generated",
                 lenses: [{ name: "clean-view", layers: [] }]
             }]
         };
    }

    // Ensure targets[0].lenses[0] exists
    if (!typedConfig.targets || !Array.isArray(typedConfig.targets) || typedConfig.targets.length === 0) {
        typedConfig.targets = [{
             input: ["diagram.mmd"],
             outputDir: "generated",
             lenses: [{ name: "clean-view", layers: [] }]
        }];
    }
    if (!typedConfig.targets[0].lenses || !Array.isArray(typedConfig.targets[0].lenses) || typedConfig.targets[0].lenses.length === 0) {
        typedConfig.targets[0].lenses = [{ name: "clean-view", layers: [] }];
    }

    const newLens = createLensFromPipeline(ops);
    // Update the first lens's layers
    typedConfig.targets[0].lenses[0].layers = newLens.layers;
    
    return yaml.dump(typedConfig);
  };

  // Update pipeline from YAML input (Best effort sync for UI)
  const updateLensYaml = (yamlStr: string) => {
    setLensYaml(yamlStr);
    
    if (!yamlStr.trim()) {
      setPipeline([]);
      return;
    }

    try {
      const config = yaml.load(yamlStr) as ConfigShape;
      const lens = config?.targets?.[0]?.lenses?.[0];

      if (!lens || !lens.layers) {
        // If YAML is valid but structure is empty/missing lenses, clear pipeline
        // But if it's just partial, maybe we should be careful. 
        // For now, if we can parse it but find no lens, it effectively means no ops.
        setPipeline([]); 
        return;
      }

      // Reconstruct pipeline from Lens
      const newPipeline: TransformOperation[] = lens.layers.map((layer: Layer) => {
        let operation: TransformOperation['operation'] = 'focusParticipant';

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
        const selector = layer.selector;
        let target = '';
        let isRegex = false;

        if (selector) {
            let info = { target: '', isRegex: false };
            if ('name' in selector) info = getTextMatcherInfo(selector.name);
            else if ('condition' in selector) info = getTextMatcherInfo(selector.condition);
            else if ('text' in selector) info = getTextMatcherInfo(selector.text);
            target = info.target;
            isRegex = info.isRegex;
        }

        return {
          operation,
          target,
          isRegex,
          enabled: true // YAML rules are always enabled
        };
      });

      setPipeline(newPipeline);
    } catch {
      // Ignore YAML validation errors during typing
      // Keep the previous pipeline state to avoid UI jumping
      // console.warn('Invalid YAML during update:', e);
    }
  };

  // Add a new transformation to the pipeline
  const addTransform = (operation: TransformOperation['operation'], target: string, isRegex?: boolean) => {
    const newPipeline = [...pipeline, { operation, target, isRegex, enabled: true }];
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
  const getSuggestions = (operationType: 'participant' | 'fragment' | 'group' | 'message'): string[] => {
    if (!ast) return [];
    
    if (operationType === 'participant') {
      const suggestions: string[] = [];
      ast.participants?.forEach((p: Participant) => {
        if (p.name) suggestions.push(p.name);
        else if (p.alias) suggestions.push(p.alias);
      });
      return [...new Set(suggestions)];
    } else if (operationType === 'group') {
      const groups: string[] = [];
      ast.groups?.forEach(g => {
        if (g.name) groups.push(g.name);
      });
      return [...new Set(groups)];
    } else if (operationType === 'message') {
      const messages: string[] = [];
      const extractMessages = (events: EventNode[]) => {
        events?.forEach((event: EventNode) => {
          if (event.kind === 'message') {
            if (event.text) messages.push(event.text);
          } else if (event.kind === 'fragment') {
            event.branches?.forEach((branch) => {
              extractMessages(branch.events);
            });
          }
        });
      };
      if (ast.events) extractMessages(ast.events);
      return [...new Set(messages)];
    } else {
      const fragments: string[] = [];
      const extractFragments = (events: EventNode[]) => {
        events?.forEach((event: EventNode) => {
          if (event.kind === 'fragment') {
            event.branches?.forEach((branch) => {
              if (branch.condition) fragments.push(branch.condition);
              extractFragments(branch.events);
            });
          }
        });
      };
      if (ast.events) {
          extractFragments(ast.events);
      }
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
