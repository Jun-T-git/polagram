
import { PolagramRoot } from '../ast';

/**
 * Strategy Interface for Diagram Parsing.
 * Implements the Strategy Pattern: different formats implement this interface.
 */
export interface DiagramParser {
  parse(code: string): PolagramRoot;
}
