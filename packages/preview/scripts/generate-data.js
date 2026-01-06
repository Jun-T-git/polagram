import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPreviewData } from '../dist/loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/ -> preview/ -> packages/ -> root/
const configPath = path.resolve(__dirname, '../../../polagram.yml');
const outDir = path.resolve(__dirname, '../dist/app');

console.log(`Generating preview data from ${configPath}...`);

async function main() {
  try {
    const data = await loadPreviewData(configPath);
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, 'preview-data.json');
    await fs.writeFile(outFile, JSON.stringify(data, null, 2));
    console.log(`Preview data generated at ${outFile}`);
  } catch (error) {
    console.error('Error generating preview data:', error);
    process.exit(1);
  }
}

main();
