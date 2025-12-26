
import { PolagramRoot } from '../../ast';
import { StructureCleaner } from '../cleaners/prune-empty';
import { UnusedCleaner } from '../cleaners/prune-unused';
import { TransformRule } from '../types';
import { transformerRegistry } from './registry';

export class TransformationEngine {
    
    public transform(root: PolagramRoot, rules: TransformRule[]): PolagramRoot {
        let currentAst = root;

        // Phase 1: Filters (User Intent)
        for (const rule of rules) {
            const transformer = transformerRegistry.get(rule);
            if (transformer) {
                currentAst = transformer.transform(currentAst);
            } else {
                console.warn(`Unknown action: ${rule.action}`);
            }
        }

        // Phase 2: Cleaners (Integrity Assurance)
        
        // 2-1. Structure Cleaner (Prune empty branches)
        currentAst = new StructureCleaner().transform(currentAst);

        // 2-2. Unused Cleaner (Prune unused definitions)
        currentAst = new UnusedCleaner().transform(currentAst);

        return currentAst;
    }
}
