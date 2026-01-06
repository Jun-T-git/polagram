import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { build } from './builder.js';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
  },
}));

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('./loader.js', () => ({
  loadPreviewData: vi.fn(),
}));

import { loadPreviewData } from './loader.js';

describe('build', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (loadPreviewData as any).mockResolvedValue({ cases: [] });
  });

  it('should build the preview site', async () => {
    const options = {
      config: 'polagram.yml',
      outDir: 'dist-preview',
    };

    await build(options);

    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('dist-preview'),
      { recursive: true },
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('preview-data.json'),
      expect.any(String),
    );
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('vite build'),
      expect.any(Object),
    );
  });
});
