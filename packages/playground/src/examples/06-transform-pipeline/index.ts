
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

  // Scenario 1: Focus Inventory + Unwrap "Stock Available"
  // This demonstrates the power of method chaining!
  console.log('Processing Scenario 1: Focus Inventory + Unwrap Stock...');
  const pipeline = Polagram.init(mmdContent)
    .focusParticipant('InventoryService')
    .focusFragment('Stock Available')
    .toMermaid();
  
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.01-pipeline.mmd`), pipeline);

  console.log(`Done. Check ${outputDir} for results.`);
}

main().catch(console.error);
