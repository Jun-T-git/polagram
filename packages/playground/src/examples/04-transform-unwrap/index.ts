
import { Polagram } from '@polagram/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const inputDir = path.join(__dirname, 'input');
  const outputDir = path.join(__dirname, 'output');
  
  if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
  }

  const mmdPath = path.join(inputDir, 'ecommerce.mmd');
  const mmdContent = fs.readFileSync(mmdPath, 'utf-8');
  const inputBaseName = path.basename(mmdPath, path.extname(mmdPath));

  console.log(`Reading input from: ${mmdPath}`);

  // Scenario 1: Unwrap "Retry" Loop
  console.log('Processing Scenario 1: Unwrap "Retry" Loop...');
  const unwrapLoop = Polagram.init(mmdContent)
    .unwrap(/Retry/)
    .toMermaid();
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.01-unwrap-loop.mmd`), unwrapLoop);

  // Scenario 2: Unwrap "Stock Available"
  console.log('Processing Scenario 2: Unwrap "Stock Available" case...');
  const unwrapStock = Polagram.init(mmdContent)
    .unwrap('Stock Available')
    .toMermaid();
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.02-unwrap-stock.mmd`), unwrapStock);

  console.log(`Done. Check ${outputDir} for results.`);
}

main().catch(console.error);
