/**
 * Type definitions for @polagram/preview
 */

import type { LensConfig } from '@polagram/core';

export interface PreviewData {
  cases: PreviewCase[];
}

export interface PreviewCase {
  /** Unique ID for URL routing: "targetIndex/inputPath/lensName" */
  id: string;
  targetIndex: number;
  inputPath: string;
  lensName: string;
  sourceCode: string;
  /** Pre-computed transformed code with all layers applied */
  transformedCode: string;
  /** The lens configuration for this case */
  lens: LensConfig;
}

export interface BuildOptions {
  config: string;
  outDir: string;
}

export interface ServeOptions {
  config: string;
  port: number;
}
