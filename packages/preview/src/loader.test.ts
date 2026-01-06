import { promises as fs } from 'fs';
import { glob } from 'glob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPreviewData } from './loader.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('glob');

describe('loadPreviewData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load config and generate preview data', async () => {
    const mockConfigPath = '/path/to/polagram.yml';
    const mockConfigContent = `
version: 1
targets:
  - input: ["*.mmd"]
    outputDir: "dist"
    lenses:
      - name: lens1
        layers: []
`;
    const mockFiles = ['/path/to/test.mmd'];
    const mockFileContent = 'graph TD; A-->B;';

    (fs.readFile as any).mockImplementation((path: string) => {
      if (path === mockConfigPath) return Promise.resolve(mockConfigContent);
      if (path === '/path/to/test.mmd') return Promise.resolve(mockFileContent);
      return Promise.reject(new Error(`File not found: ${path}`));
    });

    (glob as any).mockResolvedValue(mockFiles);

    const data = await loadPreviewData(mockConfigPath);

    expect(data.cases).toHaveLength(2); // Original + lens1
    expect(data.cases[0].lensName).toBe('(original)');
    expect(data.cases[1].lensName).toBe('lens1');
    expect(data.cases[0].sourceCode).toBe(mockFileContent);
  });
});
