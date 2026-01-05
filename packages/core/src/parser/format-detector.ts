/**
 * Supported diagram formats
 */
export type DiagramFormat = 'mermaid' | 'plantuml';

/**
 * Format detection utilities for diagram source code.
 * Detects diagram format based on file extension and content analysis.
 */
export class FormatDetector {
  /**
   * File extensions mapped to their diagram formats
   */
  private static readonly EXTENSION_MAP: Record<string, DiagramFormat> = {
    '.puml': 'plantuml',
    '.plantuml': 'plantuml',
    '.pu': 'plantuml',
    '.mmd': 'mermaid',
    '.mermaid': 'mermaid',
  };

  /**
   * Content patterns for format detection
   */
  private static readonly CONTENT_PATTERNS: Array<{
    pattern: RegExp;
    format: DiagramFormat;
  }> = [
    { pattern: /^\s*@startuml/m, format: 'plantuml' },
    { pattern: /^\s*sequenceDiagram/m, format: 'mermaid' },
  ];

  /**
   * Detect diagram format from file path and content.
   * 
   * @param filePath - Path to the diagram file
   * @param content - Content of the diagram file
   * @returns Detected format, or null if format cannot be determined
   * 
   * @example
   * ```typescript
   * const format = FormatDetector.detect('diagram.puml', content);
   * if (format === 'plantuml') {
   *   // Process as PlantUML
   * }
   * ```
   */
  static detect(filePath: string, content: string): DiagramFormat | null {
    // Try extension-based detection first
    const extensionFormat = this.detectByExtension(filePath);
    if (extensionFormat) {
      return extensionFormat;
    }

    // Fall back to content-based detection
    return this.detectByContent(content);
  }

  /**
   * Detect format based on file extension.
   * 
   * @param filePath - Path to the diagram file
   * @returns Detected format, or null if extension is not recognized
   */
  static detectByExtension(filePath: string): DiagramFormat | null {
    const ext = filePath.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext) {
      return null;
    }
    return this.EXTENSION_MAP[ext] || null;
  }

  /**
   * Detect format based on content patterns.
   * 
   * @param content - Content of the diagram file
   * @returns Detected format, or null if no pattern matches
   */
  static detectByContent(content: string): DiagramFormat | null {
    for (const { pattern, format } of this.CONTENT_PATTERNS) {
      if (pattern.test(content)) {
        return format;
      }
    }
    return null;
  }

  /**
   * Get file extension for a given format.
   * 
   * @param format - Diagram format
   * @returns Default file extension for the format
   */
  static getDefaultExtension(format: DiagramFormat): string {
    switch (format) {
      case 'plantuml':
        return '.puml';
      case 'mermaid':
        return '.mmd';
    }
  }
}
